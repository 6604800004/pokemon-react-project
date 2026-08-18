import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { API_Base, CDN } from "../config";
import {
  type PokemonDetailData,
  type TypeDamageRelations,
  type Variety,
} from "../data/pokemonData";
import { BuildPokemon, Status_Label, getPokemonId } from "../data/pokemonData";
import StatBar from "./StatusBar";
import PokemonForms from "./PokemonForms";

// id ที่แยกเป็น species กับลำดับร่าง เช่น "0026_1" ตัวที่ 26 ร่างที่ 1
type ParsedId = { speciesId: number; formIndex: number };

// แปลง id จาก url (เช่น "26" หรือ "26_1") กลับเป็น speciesId/formIndex
// ถ้าไม่ตรงรูปแบบตัวเลข (เช่นเป็นชื่อโปเกมอน) จะคืนค่า null
const parseRouteId = (raw: string): ParsedId | null => {
  const match = raw.match(/^(\d+)(?:_(\d+))?$/); // ผลจับคู่ regex ถ้า raw ไม่ใช่รูปแบบตัวเลขจะเป็น null
  if (!match) return null;
  const speciesId = parseInt(match[1], 10); // เลข species จากกลุ่มแรกของ regex
  const formIndex = match[2] ? parseInt(match[2], 10) : 0; // ลำดับร่างจากกลุ่มที่สอง ถ้าไม่มีถือว่าเป็นร่างหลัก (0)
  return { speciesId, formIndex };
};

// สร้าง id สำหรับใส่ใน url จาก speciesId และลำดับร่าง เติม 0 นำหน้าให้ครบ 4 หลัก
// ร่างหลัก (formIndex 0) ไม่ต้องมีต่อท้าย ส่วนร่างอื่นจะมี "_ลำดับ" ต่อท้าย
const buildRouteId = (speciesId: number, formIndex: number): string => {
  const padded = speciesId.toString().padStart(4, "0"); // speciesId แบบเติม 0 นำหน้าครบ 4 หลัก
  return formIndex === 0 ? padded : `${padded}_${formIndex}`;
};

function PokemonDetail() {
  const nav = useNavigate(); // ใช้เปลี่ยนหน้า เช่น ไปโปเกมอนตัวก่อนหน้า/ถัดไป หรือไปหน้า 404
  const { id } = useParams(); // id หรือชื่อโปเกมอนจาก url
  const [data, setData] = useState<PokemonDetailData | null>(null); // ข้อมูลหลักของโปเกมอนตัวนี้
  const [speciesId, setSpeciesId] = useState<number | null>(null); // เลข id ของ species (ใช้แสดงเลขเด็กซ์)
  const [genus, setGenus] = useState(""); // ชนิด/สายพันธุ์ เช่น "โปเกมอนเมาส์"
  const [flavorText, setFlavorText] = useState(""); // คำบรรยายโปเกมอนจากเกม
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({}); // ตัวคูณความเสียหายที่ได้รับจากแต่ละ type
  const [varieties, setVarieties] = useState<Variety[]>([]); // ร่างอื่น ๆ ของ species นี้
  const [evolutionChainUrl, setEvolutionChainUrl] = useState(""); // url ของสายวิวัฒนาการ ส่งต่อให้ PokemonForms
  const [prevPokemon, setPrevPokemon] = useState<{
    id: number;
    name: string;
    nav: string;
  } | null>(null); // โปเกมอนตัวก่อนหน้าไว้ทำปุ่มเลื่อนซ้าย
  const [nextPokemon, setNextPokemon] = useState<{
    id: number;
    name: string;
    nav: string;
  } | null>(null); // โปเกมอนตัวถัดไปไว้ทำปุ่มเลื่อนขวา
  const [abilityPopup, setAbilityPopup] = useState<{
    name: string;
    text: string;
  } | null>(null); // popup อธิบายความสามารถพิเศษที่กำลังเปิดอยู่
  const [abilityLoading, setAbilityLoading] = useState(false); // กำลังโหลดคำอธิบายความสามารถพิเศษอยู่หรือไม่

  // เปลี่ยน url รูปจาก raw github ไปใช้ CDN แทนเพื่อโหลดเร็วขึ้น
  const toJsdelivr = (url: string) => url.replace(API_Base, CDN);

  // โหลดคำอธิบายความสามารถพิเศษ (ability) มาแสดงใน popup เมื่อกดไอคอน "?"
  const showAbilityInfo = async (name: string, url: string) => {
    setAbilityPopup({ name, text: "" });
    setAbilityLoading(true);
    try {
      const res = await fetch(url); // ผลตอบกลับจาก endpoint ของ ability นี้
      const json = await res.json(); // ข้อมูล ability แบบเต็ม (มีคำอธิบายหลายภาษา)
      const thEntry = json.effect_entries?.find(
        (e: { language: { name: string } }) => e.language.name === "th",
      ); // รายการคำอธิบายภาษาไทย (ถ้ามี)
      const enEntry = json.effect_entries?.find(
        (e: { language: { name: string } }) => e.language.name === "en",
      ); // รายการคำอธิบายภาษาอังกฤษ ใช้เป็นตัวสำรอง
      // ใช้คำอธิบายภาษาไทยก่อน ถ้าไม่มีค่อย fallback เป็นอังกฤษ (แบบเต็มก่อนแบบย่อ)
      const text =
        thEntry?.effect ??
        enEntry?.effect ??
        enEntry?.short_effect ??
        "ไม่มีข้อมูล"; // ข้อความสุดท้ายที่จะเอาไปโชว์ใน popup
      setAbilityPopup({ name, text });
    } catch {
      setAbilityPopup({ name, text: "โหลดข้อมูลไม่สำเร็จ" });
    } finally {
      setAbilityLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      nav("/404", { replace: true });
      return;
    }

    window.scrollTo(0, 0); // เปลี่ยนโปเกมอนแล้วเลื่อนขึ้นบนสุด ให้เหมือนเปิดหน้าใหม่

    let cancelled = false; // กันไม่ให้ setState หลังเปลี่ยนหน้า/เปลี่ยน id ไปแล้ว

    const fetchData = async () => {
      try {
        // ถ้า id เป็นตัวเลข (เช่น "26_1") ต้องหาชื่อร่างที่ตรงกับ formIndex จาก species ก่อน
        // ถ้า id เป็นชื่ออยู่แล้ว (เช่น "raichu-alola") ใช้ชื่อนั้นยิง pokemon ได้เลย
        const parsed = parseRouteId(id); // แยก speciesId/formIndex ถ้า id เป็นตัวเลข ไม่งั้นเป็น null
        let pokemonName: string; // ชื่อร่างที่จะใช้ยิง endpoint /pokemon ต่อไป
        if (parsed) {
          const speciesRes = await fetch(
            `${API_Base}/pokemon-species/${parsed.speciesId}`,
          ); // ผลตอบกลับ species ตาม speciesId ที่แยกได้
          if (!speciesRes.ok) {
            if (!cancelled) nav("/404", { replace: true });
            return;
          }
          const speciesJsonPeek = await speciesRes.json(); // ข้อมูล species แบบเต็ม (เอาไว้แค่ดูรายชื่อร่างก่อน)
          const varietiesPeek: Variety[] = (
            speciesJsonPeek.varieties ?? []
          ).filter((v: Variety) => BuildPokemon(v.pokemon.name, v.is_default)); // ร่างทั้งหมดที่ผ่านเงื่อนไข BuildPokemon
          const targetVariety = varietiesPeek[parsed.formIndex]; // ร่างที่ตรงกับลำดับ formIndex ที่ต้องการ
          if (!targetVariety) {
            if (!cancelled) nav("/404", { replace: true });
            return;
          }
          pokemonName = targetVariety.pokemon.name;
        } else {
          pokemonName = id;
        }

        const res = await fetch(`${API_Base}/pokemon/${pokemonName}`); // ผลตอบกลับข้อมูลโปเกมอนตัวนี้แบบเต็ม
        if (!res.ok) {
          if (!cancelled) nav("/404", { replace: true });
          return;
        }
        const json: PokemonDetailData = await res.json(); // ข้อมูลหลัก (stats, types, sprites) ของโปเกมอนตัวนี้
        if (cancelled) return;
        setData(json);

        // โหลดข้อมูล species เพิ่ม (ชนิด, คำบรรยาย, ร่างอื่น, สายวิวัฒนาการ)
        const speciesRes = await fetch(json.species.url); // ผลตอบกลับ species ของโปเกมอนตัวนี้
        const speciesJson = await speciesRes.json(); // ข้อมูล species แบบเต็ม
        if (cancelled) return;

        const sId = parseInt(getPokemonId(json.species.url), 10); // เลข id ของ species แปลงจาก url เป็นตัวเลข
        setSpeciesId(sId);

        // ใช้ชนิดภาษาไทยก่อน ถ้าไม่มีค่อย fallback เป็นอังกฤษ
        const thGenus = speciesJson.genera.find(
          (g: { language: { name: string } }) => g.language.name === "th",
        ); // ชนิดพันธุ์ภาษาไทย (ถ้ามี)
        const enGenus = speciesJson.genera.find(
          (g: { language: { name: string } }) => g.language.name === "en",
        ); // ชนิดพันธุ์ภาษาอังกฤษ ใช้เป็นตัวสำรอง
        setGenus(thGenus?.genus ?? enGenus?.genus ?? "-");

        const speciesVarieties: Variety[] = (
          speciesJson.varieties ?? []
        ).filter((v: Variety) => BuildPokemon(v.pokemon.name, v.is_default)); // ร่างทั้งหมดของ species นี้ที่ผ่านเงื่อนไข BuildPokemon
        setVarieties(speciesVarieties);
        setEvolutionChainUrl(speciesJson.evolution_chain?.url ?? "");

        // ตำแหน่งร่างปัจจุบันในลิสต์ร่างทั้งหมด ใช้หาร่างก่อนหน้า/ถัดไปในกลุ่มเดียวกัน
        const currentIndex = speciesVarieties.findIndex(
          (v) => v.pokemon.name === json.name,
        ); // ตำแหน่งของร่างปัจจุบันในลิสต์ ถ้าหาไม่เจอจะเป็น -1

        // id ที่เข้ามาทาง url อาจเป็นชื่อ (เช่น "venusaur-mega") หรือเลขที่ยังไม่เติม 0 นำหน้า (เช่น "3")
        // ให้เปลี่ยน url เป็นรูปแบบมาตรฐาน (เช่น "0003_1") ก่อน แล้ว effect จะทำงานใหม่ด้วย id ที่ถูกต้อง
        // ใช้ replace เพื่อไม่ให้ url แบบเดิมค้างอยู่ใน history (กดย้อนกลับแล้วจะไม่วนกลับมาที่นี่)
        if (currentIndex !== -1) {
          const canonicalId = buildRouteId(sId, currentIndex); // id รูปแบบมาตรฐานของร่างที่กำลังดูอยู่
          if (canonicalId !== id) {
            nav(`/PokeDex/${canonicalId}`, { replace: true });
            return;
          }
        }

        // หาโปเกมอนตัวก่อนหน้า/ถัดไปสำหรับปุ่มเลื่อน
        // ลำดับความสำคัญ: ร่างถัดไปของ species เดียวกันก่อน ถ้าไม่มีแล้วค่อยข้าม species ไป (ตัวแรก/ตัวสุดท้ายของ species นั้น)
        const resolveNeighbor = async (
          direction: "prev" | "next",
        ): Promise<{ id: number; name: string; nav: string } | null> => {
          if (currentIndex !== -1) {
            const neighborIndex =
              direction === "next" ? currentIndex + 1 : currentIndex - 1; // ตำแหน่งร่างข้าง ๆ ในลิสต์เดียวกัน
            const neighborVariety = speciesVarieties[neighborIndex]; // ร่างข้าง ๆ ถ้ามี (undefined ถ้าเกินขอบลิสต์)
            if (neighborVariety) {
              try {
                const r = await fetch(neighborVariety.pokemon.url); // ผลตอบกลับข้อมูลร่างข้าง ๆ นี้
                if (r.ok) {
                  const d = await r.json(); // ข้อมูลร่างข้าง ๆ แบบเต็ม (เอาแค่ชื่อไปใช้)
                  return {
                    id: sId,
                    name: d.name,
                    nav: buildRouteId(sId, neighborIndex),
                  };
                }
              } catch {}
            }
          }

          // ไม่มีร่างถัดไปในกลุ่มเดียวกันแล้ว ให้ข้ามไป species ถัดไป/ก่อนหน้า
          const neighborSpeciesId = direction === "next" ? sId + 1 : sId - 1; // เลข species ที่จะข้ามไป
          if (neighborSpeciesId < 1) return null;

          try {
            if (direction === "next") {
              // ถัดไปเสมอเริ่มที่ร่างแรก (formIndex 0) ของ species ถัดไป
              const r = await fetch(`${API_Base}/pokemon/${neighborSpeciesId}`); // ผลตอบกลับของโปเกมอน species ถัดไป
              if (!r.ok) return null;
              const d = await r.json(); // ข้อมูลโปเกมอน species ถัดไปแบบเต็ม
              return {
                id: neighborSpeciesId,
                name: d.name,
                nav: buildRouteId(neighborSpeciesId, 0),
              };
            }

            // ก่อนหน้าต้องไปเอาร่างสุดท้ายของ species ก่อนหน้า จึงต้องโหลด species นั้นมาดูก่อนว่ามีกี่ร่าง
            const neighborSpeciesRes = await fetch(
              `${API_Base}/pokemon-species/${neighborSpeciesId}`,
            ); // ผลตอบกลับ species ก่อนหน้า
            if (!neighborSpeciesRes.ok) return null;
            const neighborSpeciesJson = await neighborSpeciesRes.json(); // ข้อมูล species ก่อนหน้าแบบเต็ม

            const neighborVarieties: Variety[] = (
              neighborSpeciesJson.varieties ?? []
            ).filter((v: Variety) =>
              BuildPokemon(v.pokemon.name, v.is_default),
            ); // ร่างทั้งหมดของ species ก่อนหน้าที่ผ่านเงื่อนไข BuildPokemon

            const lastIndex = neighborVarieties.length - 1; // ตำแหน่งร่างสุดท้ายของ species ก่อนหน้า
            const lastVariety = neighborVarieties[lastIndex]; // ร่างสุดท้ายนั้น (ตัวที่จะแสดงเป็น "ก่อนหน้า")
            if (!lastVariety) return null;

            const r = await fetch(lastVariety.pokemon.url); // ผลตอบกลับข้อมูลร่างสุดท้ายนั้น
            if (!r.ok) return null;
            const d = await r.json(); // ข้อมูลร่างสุดท้ายแบบเต็ม (เอาแค่ชื่อไปใช้)
            return {
              id: neighborSpeciesId,
              name: d.name,
              nav: buildRouteId(neighborSpeciesId, lastIndex),
            };
          } catch {
            return null;
          }
        };

        // ปุ่มก่อนหน้า/ถัดไปไม่ต้องรอกัน ปล่อยให้อัปเดตทีหลังเมื่อโหลดเสร็จ
        resolveNeighbor("prev").then((res) => {
          if (!cancelled) setPrevPokemon(res);
        });
        resolveNeighbor("next").then((res) => {
          if (!cancelled) setNextPokemon(res);
        });

        // ใช้คำบรรยายภาษาไทยก่อน ถ้าไม่มีค่อย fallback เป็นอังกฤษ
        const thEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "th",
        ); // คำบรรยายภาษาไทย (ถ้ามี)
        const enEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "en",
        ); // คำบรรยายภาษาอังกฤษ ใช้เป็นตัวสำรอง
        const rawText = thEntry?.flavor_text ?? enEntry?.flavor_text ?? ""; // คำบรรยายดิบก่อนตัดขึ้นบรรทัดใหม่ทิ้ง
        // ข้อความดิบจาก PokeAPI มีตัวขึ้นบรรทัดใหม่/ตัวเว้นวรรคปนอยู่ ต้องรวมเป็นบรรทัดเดียว
        setFlavorText(
          rawText
            .replace(/[\f\n\r]+/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        );

        // โหลดความสัมพันธ์ความเสียหายของทุก type ที่โปเกมอนตัวนี้มี (อาจมี 1-2 type)
        const typeResults: TypeDamageRelations[] = await Promise.all(
          json.types.map((t) => fetch(t.type.url).then((res) => res.json())),
        ); // ความสัมพันธ์ความเสียหายของแต่ละ type ที่โปเกมอนตัวนี้มี
        if (cancelled) return;

        // รวมตัวคูณความเสียหายจากทุก type เข้าด้วยกัน (คูณสะสม เพราะโดน 2 type พร้อมกันได้)
        // double_damage_from = โดนจาก type นี้แล้วแรงขึ้น 2 เท่า (จุดอ่อน)
        // half_damage_from = โดนจาก type นี้แล้วแรงลด 0.5 เท่า (ต้านทาน)
        // no_damage_from = ไม่ได้รับความเสียหายเลยจาก type นี้ (ภูมิคุ้มกัน)
        const multipliers: Record<string, number> = {}; // ตัวคูณความเสียหายสะสมของแต่ละ type ที่โปเกมอนตัวนี้ได้รับ
        typeResults.forEach((typeData) => {
          const rel = typeData.damage_relations; // ความสัมพันธ์ความเสียหายของ type นี้ที่กำลังวนอยู่
          rel.double_damage_from.forEach((t) => {
            multipliers[t.name] = (multipliers[t.name] ?? 1) * 2;
          });
          rel.half_damage_from.forEach((t) => {
            multipliers[t.name] = (multipliers[t.name] ?? 1) * 0.5;
          });
          rel.no_damage_from.forEach((t) => {
            multipliers[t.name] = (multipliers[t.name] ?? 1) * 0;
          });
        });
        setWeaknesses(multipliers);
      } catch (err) {
        if (!cancelled) nav("/404", { replace: true });
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, nav]);

  // ปุ่มเลื่อนไปโปเกมอนตัวก่อนหน้า
  const handlePreviousPokemon = () => {
    if (!prevPokemon) return;
    nav(`/PokeDex/${prevPokemon.nav}`);
  };

  // ปุ่มเลื่อนไปโปเกมอนตัวถัดไป
  const handleNextPokemon = () => {
    if (!nextPokemon) return;
    nav(`/PokeDex/${nextPokemon.nav}`);
  };

  if (!data) return null;

  // เอาเฉพาะ type ที่โดนความเสียหายมากกว่าปกติ (จุดอ่อน) เรียงจากคูณมากไปน้อย
  const weaknessList = Object.entries(weaknesses)
    .filter(([, mult]) => mult > 1)
    .sort((a, b) => b[1] - a[1]); // [ชื่อ type, ตัวคูณ] เรียงจุดอ่อนที่ร้ายแรงที่สุดไว้ก่อน

  const spriteUrl = toJsdelivr(
    data.sprites.other["official-artwork"].front_default ??
      data.sprites.front_default,
  ); // url รูปหลักที่ใช้แสดงตัวโปเกมอนบนหน้ารายละเอียด

  return (
    <>
      <header className="flex items-center justify-center min-h-[60px] bg-white z-40">
        <div className="logo__ z-40" />
      </header>

      <div className="bg-[#1b252f]">
        <div className="relative max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden">
            <div className="absolute cursor-pointer top-10 left-1/2 -translate-x-1/2 text-[28px] text-black z-40 whitespace-nowrap px-[200px]">
              <button onClick={() => nav("/")}> โปเกเด็กซ์ </button>
            </div>

            <img
              src="\src\assets\img\main_bg_v15.jpg"
              alt="Pokedex banner"
              className="w-full block"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
              <img
                src="\src\assets\img\pokemon_bg.png"
                className="h-auto object-cover object-center select-none animate-spin [animation-duration:3s]"
                aria-hidden="true"
              />
              <img
                src="\src\assets\img\pokemon_circle_bg.png"
                className="absolute h-[auto] object-cover object-center select-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ข้อมูลโปเกมอน : รูป, id, ชื่อ */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
            <div className="relative w-[25%] h-[25%]">
              {/* รูปโปเกมอน */}
              <div className="w-full h-full">
                <img
                  src={spriteUrl}
                  alt={data.name}
                  className="w-full h-full object-contain [filter:drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_3px_#ffffff)_drop-shadow(0_0_3px_#ffffff)] z-10"
                />
              </div>

              {/* id */}
              <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 z-20">
                <span className="text-[#b3eafe] text-[39px]">
                  {(speciesId ?? data.id).toString().padStart(4, "0")}
                </span>
              </div>

              {/* ชื่อโปเกมอน */}
              <div
                className="absolute -top-[9%] left-1/2 -translate-x-1/2 z-40 whitespace-nowrap"
                style={{
                  textShadow:
                    "0 0 3px #000, 2px 2px 7px #9be1ff, -2px -2px 7px #9be1ff",
                }}
              >
                <span className="text-[#ffffff] text-[40px] font-bold">
                  {data.name.replace(/-/g, " ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ปุ่มเปลี่ยนโปเกมอน: ซ้าย */}
          {prevPokemon ? (
            <div className="absolute top-[140px] left-0 z-30">
              <img
                src="\src\assets\img\arrow_pc_left.png"
                alt=""
                className="w-[400px] object-contain"
              />
              <button
                onClick={handlePreviousPokemon}
                className="absolute top-3.5 left-11 pointer-events-auto cursor-pointer group"
              >
                <div className="relative w-[64px] h-[64px]">
                  <img
                    src="\src\assets\img\arrow_left_btn.png"
                    alt="โปเกมอนก่อนหน้า"
                  />
                  <img
                    src="\src\assets\img\arrow_left_btn_on.png"
                    alt=""
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </button>
              <div className="absolute top-3.5 left-[150px] text-white pointer-events-none whitespace-nowrap">
                <span className="text-[#b3eafe] text-[19px]">
                  {prevPokemon.id.toString().padStart(4, "0")}
                </span>
                <span className="text-[20px] capitalize ml-2">
                  {prevPokemon.name.replace(/-/g, " ").toUpperCase()}
                </span>
              </div>
            </div>
          ) : null}

          {/* ปุ่มเปลี่ยนโปเกมอน: ขวา */}
          <div className="absolute top-[140px] right-0 z-30">
            <img
              src="\src\assets\img\arrow_pc_right.png"
              alt=""
              className="w-[380px] object-contain"
            />
            <button
              onClick={handleNextPokemon}
              className="absolute top-3.5 right-11 pointer-events-auto cursor-pointer group"
            >
              <div className="relative w-[64px] h-[64px]">
                <img
                  src="\src\assets\img\arrow_right_btn.png"
                  alt="โปเกมอนถัดไป"
                />
                <img
                  src="\src\assets\img\arrow_right_btn_on.png"
                  alt=""
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </button>
            {nextPokemon && (
              <div className="absolute top-3.5 right-[150px] text-white pointer-events-none whitespace-nowrap text-right">
                <span className="text-[20px] capitalize mr-2">
                  {nextPokemon.name.replace(/-/g, " ").toUpperCase()}
                </span>
                <span className="text-[#b3eafe] text-[19px]">
                  {nextPokemon.id.toString().padStart(4, "0")}
                </span>
              </div>
            )}
          </div>

          {/* ประเภท, จุดอ่อน */}
          <div className="absolute top-[280px] left-[7%] w-[260px] pointer-events-auto">
            {/* ประเภท */}
            <div>
              <p className="text-[28px] text-center text-white mb-3">ประเภท</p>
              <div className="flex flex-col gap-3">
                {data.types.map((t) => (
                  <span
                    key={t.slot}
                    onClick={() => nav(`/PokeDex?type=${t.type.name}`)}
                    className={`type type--${t.type.name} capitalize w-full text-center cursor-pointer`}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>
            </div>

            {/* จุดอ่อน */}
            {weaknessList.length > 0 && (
              <div className="mt-6">
                <p className="text-[28px] text-center text-white mb-3">
                  จุดอ่อน
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {weaknessList.map(([typeName]) => (
                    <span
                      key={typeName}
                      onClick={() => nav(`/PokeDex?type=${typeName}`)}
                      className={`type type--${typeName} capitalize w-full text-center cursor-pointer`}
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {abilityPopup ? (
            <div className="absolute top-[17.5%] right-[8%] w-[20%] pointer-events-auto">
              {/* หัวข้อ */}
              <div>
                <span className="text-[20px] text-[#b3eafe]">
                  คุณสมบัติพิเศษ
                </span>
              </div>

              {/* ปุ่มปิด */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setAbilityPopup(null)}
                  className="cursor-pointer absolute top-[3%] right-[0%] w-[20%]"
                >
                  <img
                    src="\src\assets\img\close_btn.png"
                    alt="ปิด"
                    className="w-[100%] h-[100%] object-contain"
                  />
                </button>
              </div>

              {/* เนื้อหา */}
              <div className="mt-5">
                <p className="text-[22px] font-bold capitalize text-white mb-2">
                  {abilityPopup.name.replace(/-/g, " ")}
                </p>
                <p className="text-[16px] text-white leading-relaxed">
                  {abilityLoading ? "กำลังโหลด..." : abilityPopup.text}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ส่วนสูง */}
              <div className="absolute top-[17%] right-[7%] w-[21%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">ส่วนสูง</p>
                <p className="text-[19px] text-[#ffffff]">
                  {(data.height / 10).toFixed(1)} m
                </p>
              </div>

              {/* ชนิด */}
              <div className="absolute top-[17%] right-[10%] w-[140px] flex flex-col pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">ชนิด</p>
                <p className="text-[19px] text-[#ffffff] leading-tight">
                  {genus}
                </p>
              </div>

              {/* น้ำหนัก */}
              <div className="absolute top-[21%] right-[7%] w-[21%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">น้ำหนัก</p>
                <p className="text-[19px] text-[#ffffff]">
                  {(data.weight / 10).toFixed(1)} kg
                </p>
              </div>

              {/* เพศ */}
              <div className="absolute top-[21%] right-[7%] w-[13%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">เพศ</p>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src="\src\assets\img\icon_male.png"
                    alt="ชาย"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-[#ffffff] text-[19px]">/</span>
                  <img
                    src="\src\assets\img\icon_female.png"
                    alt="หญิง"
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </div>

              {/* คุณสมบัติพิเศษ */}
              <div className="absolute top-[25%] right-[9%] w-[19%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">คุณสมบัติพิเศษ</p>
                <div className="flex flex-col gap-1 mt-1">
                  {data.abilities
                    .filter((a) => !a.is_hidden)
                    .map((a) => (
                      <p
                        key={a.slot}
                        className="text-[19px] text-[#ffffff] capitalize flex items-center gap-2"
                      >
                        {a.ability.name.replace(/-/g, " ")}
                        <button
                          onClick={() =>
                            showAbilityInfo(a.ability.name, a.ability.url)
                          }
                          className="relative cursor-pointer group"
                        >
                          <img
                            src="\src\assets\img\icon_question.png"
                            alt="ข้อมูลเพิ่มเติม"
                            className="w-8 h-8 flex items-center object-center"
                          />
                        </button>
                      </p>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* เวอร์ชัน */}
          <div className="absolute top-[34.8%] left-[4%]">
            <div className="flex items-center gap-4">
              <p className="text-[28px] text-[#b3eafe]">เวอร์ชัน</p>
              <div className="flex items-center">
                <img
                  src="\src\assets\img\icon_ball_on.png"
                  alt="Brilliant Diamond & Shining Pearl"
                  className="w-[33px] h-[33px] object-contain"
                />
                <img
                  src="\src\assets\img\icon_ball.png"
                  alt="Sword & Shield"
                  className="w-[35px] h-[35px] object-contain"
                />
              </div>
            </div>
          </div>

          {flavorText && (
            <div className="absolute top-[37%] left-[4%] w-[25%] pointer-events-auto">
              <p className="text-[19px] text-[#ffffff] leading-relaxed whitespace-normal break-words">
                {flavorText}
              </p>
            </div>
          )}

          {/* ค่าพลัง */}
          <div className="absolute top-[34.8%] right-[20%] pointer-events-auto">
            <p className="text-[28px] text-[#b3eafe] ">ค่าพลัง</p>
          </div>
          <div className="absolute top-[39%] right-[2.5%] w-[50%] pointer-events-auto">
            <div className="grid grid-cols-6 gap-4">
              {data.stats.map((s) => (
                <StatBar
                  key={s.stat.name}
                  value={s.base_stat}
                  name={Status_Label[s.stat.name] ?? s.stat.name}
                />
              ))}
            </div>
          </div>

          {/* ร่าง */}
          {varieties.length > 0 && (
            <div className="absolute top-[50%] w-[1400px] pointer-events-auto">
              <PokemonForms
                varieties={varieties}
                evolutionChainUrl={evolutionChainUrl}
                speciesId={speciesId ?? data.id}
              />
            </div>
          )}

          {/* กลับไปหน้าหลักโปเกเด็กซ์ */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center w-full max-w-[600px] h-20 mx-auto my-5">
            <button
              onClick={() => nav("/")}
              className="relative cursor-pointer group"
            >
              <img
                src="\src\assets\img\backbtn_bg.png"
                alt="หน้าหลักโปเกเด็กซ์"
              />
              <img
                src="\src\assets\img\backbtn_bg_on.png"
                alt=""
                className="absolute inset-0 opacity-0"
              />
              <span className="absolute inset-0 flex items-center justify-center text-[#b3eafe] cursor-pointer [text-shadow:0_0_5px_#b3eafe] hover:text-black transition-colors text-[19px]">
                หน้าหลักโปเกเด็กซ์
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PokemonDetail;
