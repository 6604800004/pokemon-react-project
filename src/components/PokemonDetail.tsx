import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { API_Base, CDN, ASSETS_Base, RAW_URL } from "../config";
import { type PokemonDetailData, type TypeDamageRelations, type Variety } from "../data/pokemonData";
import { BuildPokemon, Status_Label, getPokemonId } from "../data/pokemonData";
import StatBar from "./StatusBar";
import PokemonForms from "./PokemonForms";

// --- ตัวช่วยแปลง URL id <-> (speciesId, formIndex) ---
// รูปแบบ URL: "0003" = ฟอร์มธรรมดา (formIndex 0), "0003_1" = ฟอร์มพิเศษตัวที่ 1, "0003_2" = ตัวที่ 2 ...
// formIndex อิงตามลำดับใน speciesJson.varieties (default มาก่อนเสมอ ตามด้วย mega/mega-x/mega-y/gmax ตามลำดับที่ API ส่งมา)

type ParsedId = { speciesId: number; formIndex: number };

const parseRouteId = (raw: string): ParsedId | null => {
  const match = raw.match(/^(\d+)(?:_(\d+))?$/);
  if (!match) return null; // ไม่ตรง pattern เลข (เช่น เป็นชื่อฟอร์มพิเศษดิบๆ) ให้ caller จัดการต่อเอง
  const speciesId = parseInt(match[1], 10);
  const formIndex = match[2] ? parseInt(match[2], 10) : 0;
  return { speciesId, formIndex };
};

const buildRouteId = (speciesId: number, formIndex: number): string => {
  const padded = speciesId.toString().padStart(4, "0");
  return formIndex === 0 ? padded : `${padded}_${formIndex}`;
};

function PokemonDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<PokemonDetailData | null>(null);
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [genus, setGenus] = useState("");
  const [flavorText, setFlavorText] = useState("");
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({});
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [evolutionChainUrl, setEvolutionChainUrl] = useState("");
  const [prevPokemon, setPrevPokemon] = useState<{ id: number; name: string; nav: string } | null>(null);
  const [nextPokemon, setNextPokemon] = useState<{ id: number; name: string; nav: string } | null>(null);
  const [abilityPopup, setAbilityPopup] = useState<{ name: string; text: string } | null>(null);
  const [abilityLoading, setAbilityLoading] = useState(false);

  const toJsdelivr = (url: string) => url.replace(RAW_URL, CDN);

  const showAbilityInfo = async (name: string, url: string) => {
    setAbilityPopup({ name, text: "" });
    setAbilityLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      const thEntry = json.effect_entries?.find(
        (e: { language: { name: string } }) => e.language.name === "th",
      );
      const enEntry = json.effect_entries?.find(
        (e: { language: { name: string } }) => e.language.name === "en",
      );
      const text = thEntry?.effect ?? enEntry?.effect ?? enEntry?.short_effect ?? "ไม่มีข้อมูล";
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

    let cancelled = false;

    const fetchData = async () => {
      try {
        // --- แปลง id จาก URL ---
        // รองรับ 2 แบบ: "0003" / "0003_1" (เลข+index ฟอร์ม) หรือ "venusaur-gmax" (ชื่อดิบ เผื่อลิงก์เก่า/ภายนอก)
        const parsed = parseRouteId(id);

        let pokemonName: string; // ชื่อจริงที่จะใช้ fetch /pokemon/{name}

        if (parsed) {
          // --- กรณี id เป็นเลข: ต้อง fetch species ก่อน เพื่อรู้ว่า formIndex นี้คือฟอร์มอะไร ---
          const speciesRes = await fetch(`${API_Base}/pokemon-species/${parsed.speciesId}`);
          if (!speciesRes.ok) {
            if (!cancelled) nav("/404", { replace: true });
            return;
          }
          const speciesJsonPeek = await speciesRes.json();
          const varietiesPeek: Variety[] = (speciesJsonPeek.varieties ?? []).filter(
            (v: Variety) => BuildPokemon(v.pokemon.name, v.is_default),
          );
          const targetVariety = varietiesPeek[parsed.formIndex];
          if (!targetVariety) {
            if (!cancelled) nav("/404", { replace: true });
            return;
          }
          pokemonName = targetVariety.pokemon.name;
        } else {
          // --- กรณี id เป็นชื่อดิบ (เช่น ลิงก์เก่า venusaur-gmax) ---
          pokemonName = id;
        }

        // --- pokemon entry ---
        const res = await fetch(`${API_Base}/pokemon/${pokemonName}`);
        if (!res.ok) {
          if (!cancelled) nav("/404", { replace: true });
          return;
        }
        const json: PokemonDetailData = await res.json();
        if (cancelled) return;
        setData(json);

        // --- species (ใช้หา speciesId, genus, varieties, flavor text) ---
        const speciesRes = await fetch(json.species.url);
        const speciesJson = await speciesRes.json();
        if (cancelled) return;

        const sId = parseInt(getPokemonId(json.species.url), 10);
        setSpeciesId(sId);

        const thGenus = speciesJson.genera.find(
          (g: { language: { name: string } }) => g.language.name === "th",
        );
        const enGenus = speciesJson.genera.find(
          (g: { language: { name: string } }) => g.language.name === "en",
        );
        setGenus(thGenus?.genus ?? enGenus?.genus ?? "-");

        // ฟอร์มทั้งหมดของ species นี้ (default + mega/mega-x/mega-y/gmax/alola)
        // ลำดับนี้คือลำดับที่ใช้กำหนด formIndex ใน URL ด้วย (default = index 0 เสมอ)
        const speciesVarieties: Variety[] = (speciesJson.varieties ?? []).filter((v: Variety) =>
          BuildPokemon(v.pokemon.name, v.is_default),
        );
        setVarieties(speciesVarieties);
        setEvolutionChainUrl(speciesJson.evolution_chain?.url ?? "");

        // --- โปเกมอนก่อนหน้า / ถัดไป ---
        const currentIndex = speciesVarieties.findIndex(
          (v) => v.pokemon.name === json.name,
        );

        const resolveNeighbor = async (
          direction: "prev" | "next",
        ): Promise<{ id: number; name: string; nav: string } | null> => {
          if (currentIndex !== -1) {
            const neighborIndex =
              direction === "next" ? currentIndex + 1 : currentIndex - 1;
            const neighborVariety = speciesVarieties[neighborIndex];
            if (neighborVariety) {
              // ยังอยู่ใน species เดียวกัน ไปฟอร์มถัดไป/ก่อนหน้าในกลุ่ม
              try {
                const r = await fetch(neighborVariety.pokemon.url);
                if (r.ok) {
                  const d = await r.json();
                  return {
                    id: sId,
                    name: d.name,
                    nav: buildRouteId(sId, neighborIndex),
                  };
                }
              } catch {
                /* fallthrough ไป species ถัดไป */
              }
            }
          }

          // หมดฟอร์มของ species นี้แล้ว ให้ข้ามไป species ถัดไป/ก่อนหน้า
          const neighborSpeciesId = direction === "next" ? sId + 1 : sId - 1;
          if (neighborSpeciesId < 1) return null;

          try {
            if (direction === "next") {
              // next: ไปฟอร์ม default (formIndex 0) ของ species ถัดไปเสมอ
              const r = await fetch(`${API_Base}/pokemon/${neighborSpeciesId}`);
              if (!r.ok) return null;
              const d = await r.json();
              return {
                id: neighborSpeciesId,
                name: d.name,
                nav: buildRouteId(neighborSpeciesId, 0),
              };
            }

            // prev: ต้องดู varieties ของ species ก่อนหน้า แล้วไปฟอร์ม "สุดท้าย" (สมมาตรกับ next)
            const neighborSpeciesRes = await fetch(
              `${API_Base}/pokemon-species/${neighborSpeciesId}`,
            );
            if (!neighborSpeciesRes.ok) return null;
            const neighborSpeciesJson = await neighborSpeciesRes.json();

            const neighborVarieties: Variety[] = (neighborSpeciesJson.varieties ?? []).filter(
              (v: Variety) => BuildPokemon(v.pokemon.name, v.is_default),
            );

            const lastIndex = neighborVarieties.length - 1;
            const lastVariety = neighborVarieties[lastIndex];
            if (!lastVariety) return null;

            const r = await fetch(lastVariety.pokemon.url);
            if (!r.ok) return null;
            const d = await r.json();
            return {
              id: neighborSpeciesId,
              name: d.name,
              nav: buildRouteId(neighborSpeciesId, lastIndex),
            };
          } catch {
            return null;
          }
        };

        resolveNeighbor("prev").then((res) => {
          if (!cancelled) setPrevPokemon(res);
        });
        resolveNeighbor("next").then((res) => {
          if (!cancelled) setNextPokemon(res);
        });

        // --- flavor text ---
        const thEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "th",
        );
        const enEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "en",
        );
        const rawText = thEntry?.flavor_text ?? enEntry?.flavor_text ?? "";
        setFlavorText(
          rawText
            .replace(/[\f\n\r]+/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        );

        // --- damage relations (จุดอ่อน) ---
        const typeResults: TypeDamageRelations[] = await Promise.all(
          json.types.map((t) => fetch(t.type.url).then((res) => res.json())),
        );
        if (cancelled) return;

        const multipliers: Record<string, number> = {};
        typeResults.forEach((typeData) => {
          const rel = typeData.damage_relations;
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

  const handlePreviousPokemon = () => {
    if (!prevPokemon) return;
    nav(`/PokeDex/${prevPokemon.nav}`);
  };

  const handleNextPokemon = () => {
    if (!nextPokemon) return;
    nav(`/PokeDex/${nextPokemon.nav}`);
  };

  if (!data) return null;

  const weaknessList = Object.entries(weaknesses)
    .filter(([, mult]) => mult > 1)
    .sort((a, b) => b[1] - a[1]);

  const spriteUrl = toJsdelivr(
    data.sprites.other["official-artwork"].front_default ?? data.sprites.front_default,
  );

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
              src={`${ASSETS_Base}/main_bg_v15.jpg`}
              alt="Pokedex banner"
              className="w-full block"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
              <img
                src={`${ASSETS_Base}/pokemon_bg.png`}
                className="h-auto object-cover object-center select-none animate-spin [animation-duration:3s]"
                aria-hidden="true"
              />
              <img
                src={`${ASSETS_Base}/pokemon_circle_bg.png`}
                className="absolute h-[auto] object-cover object-center select-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ข้อมูลโปเกมอน: รูป, ID, ชื่อ */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
            <div className="relative w-[25%] h-[25%]">
              <img
                src={spriteUrl}
                alt={data.name}
                className="w-full h-full object-contain [filter:drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_3px_#ffffff)_drop-shadow(0_0_3px_#ffffff)] z-10"
              />
              <span className="absolute -top-[80px] left-1/2 -translate-x-1/2 text-[#b3eafe] text-[39px] z-20">
                {(speciesId ?? data.id).toString().padStart(4, "0")}
              </span>
              <span
                className="absolute -top-[40px] left-1/2 -translate-x-1/2 text-[#ffffff] text-[45px] font-bold z-40 whitespace-nowrap"
                style={{
                  textShadow: "0 0 3px #000, 2px 2px 7px #9be1ff, -2px -2px 7px #9be1ff",
                }}
              >
                {data.name.replace(/-/g, " ").toUpperCase()}
              </span>
            </div>
          </div>

          {/* ปุ่มเปลี่ยนโปเกมอน: ซ้าย */}
          {prevPokemon ? (
            <div className="absolute top-[140px] left-0 z-30">
              <img
                src={`${ASSETS_Base}/arrow_pc_left.png`}
                alt=""
                className="w-[400px] object-contain"
              />
              <button
                onClick={handlePreviousPokemon}
                className="absolute top-3.5 left-11 pointer-events-auto cursor-pointer group"
              >
                <div className="relative w-[64px] h-[64px]">
                  <img src={`${ASSETS_Base}/arrow_left_btn.png`} alt="โปเกมอนก่อนหน้า" />
                  <img
                    src={`${ASSETS_Base}/arrow_left_btn_on.png`}
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
              src={`${ASSETS_Base}/arrow_pc_right.png`}
              alt=""
              className="w-[380px] object-contain"
            />
            <button
              onClick={handleNextPokemon}
              className="absolute top-3.5 right-11 pointer-events-auto cursor-pointer group"
            >
              <div className="relative w-[64px] h-[64px]">
                <img src={`${ASSETS_Base}/arrow_right_btn.png`} alt="โปเกมอนถัดไป" />
                <img
                  src={`${ASSETS_Base}/arrow_right_btn_on.png`}
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
            <p className="text-[28px] text-white mb-3">ประเภท</p>
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

            {weaknessList.length > 0 && (
              <div className="mt-6">
                <p className="text-[28px] text-white mb-3">จุดอ่อน</p>
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
            <div className="absolute top-[18%] right-[7%] w-[20%] pointer-events-auto">
              <span className="text-[20px] text-[#b3eafe]">คุณสมบัติพิเศษ</span>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setAbilityPopup(null)}
                  className="cursor-pointer absolute top-[3%] right-[0%] w-[20%]"
                >
                  <img
                    src={`${ASSETS_Base}/close_btn.png`}
                    alt="ปิด"
                    className="w-[100%] h-[100%] object-contain"
                  />
                </button>
              </div>
              
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
              <div className="absolute top-[17%] right-[5%] w-[21%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">ส่วนสูง</p>
                <p className="text-[19px] text-[#ffffff]">{data.height / 10} m</p>
              </div>

              {/* ชนิด */}
              <div className="absolute top-[17%] right-[10%] w-[110px] flex flex-col pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">ชนิด</p>
                <p className="text-[19px] text-[#ffffff] leading-tight">{genus}</p>
              </div>

              {/* น้ำหนัก */}
              <div className="absolute top-[21%] right-[5%] w-[21%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">น้ำหนัก</p>
                <p className="text-[19px] text-[#ffffff]">{data.weight / 10} kg</p>
              </div>

              {/* เพศ */}
              <div className="absolute top-[21%] right-[5%] w-[13%] pointer-events-auto">
                <p className="text-[19px] text-[#b3eafe]">เพศ</p>
                <div className="flex items-center gap-2 mt-1">
                  <img src={`${ASSETS_Base}/icon_male.png`} alt="ชาย" className="w-6 h-6 object-contain" />
                  <span className="text-[#ffffff] text-[19px]">/</span>
                  <img src={`${ASSETS_Base}/icon_female.png`} alt="หญิง" className="w-6 h-6 object-contain" />
                </div>
              </div>

              {/* คุณสมบัติพิเศษ */}
              <div className="absolute top-[25%] right-[7%] w-[19%] pointer-events-auto">
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
                          onClick={() => showAbilityInfo(a.ability.name, a.ability.url)}
                          className="relative cursor-pointer group"
                        >
                        <img
                          src={`${ASSETS_Base}/icon_question.png`}
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
          <div className="absolute top-[725px] left-[4%]">
            <div className="flex items-center gap-4">
              <p className="text-[28px] text-[#b3eafe]">เวอร์ชัน</p>
              <div className="flex items-center gap-2">
                <img
                  src={`${ASSETS_Base}/icon_ball_on.png`}
                  alt="Brilliant Diamond & Shining Pearl"
                  className="w-[33px] h-[33px] object-contain"
                />
                <img
                  src={`${ASSETS_Base}/icon_ball.png`}
                  alt="Sword & Shield"
                  className="w-[33px] h-[33px] object-contain"
                />
              </div>
            </div>
          </div>

          {flavorText && (
            <div className="absolute top-[770px] left-[4%] w-[400px] pointer-events-auto">
              <p className="text-[19px] text-[#ffffff] leading-relaxed whitespace-normal break-words">
                {flavorText}
              </p>
            </div>
          )}

          {/* ค่าพลัง */}
          <div className="absolute top-[725px] right-[20%] pointer-events-auto">
            <p className="text-[28px] text-[#b3eafe] ">ค่าพลัง</p>
          </div>

          <div className="absolute top-[800px] right-[2.5%] w-[600px] pointer-events-auto">
            <div className="grid grid-cols-6 gap-4">
              {data.stats.map((s) => (
                <StatBar
                  key={s.stat.name}
                  label={Status_Label[s.stat.name] ?? s.stat.name}
                  value={s.base_stat}
                />
              ))}
            </div>
          </div>

          {/* ร่าง */}
          {varieties.length > 0 && (
            <div className="absolute top-[1050px] w-[1400px] pointer-events-auto">
              <PokemonForms
                varieties={varieties}
                evolutionChainUrl={evolutionChainUrl}
                speciesId={speciesId ?? data.id}
              />
            </div>
          )}

          {/* กลับไปหน้าหลักโปเกเด็กซ์ */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center w-full max-w-[600px] h-20 mx-auto my-5">
            <button onClick={() => nav("/")} className="relative cursor-pointer group">
              <img src={`${ASSETS_Base}/backbtn_bg.png`} alt="หน้าหลักโปเกเด็กซ์" />
              <img
                src={`${ASSETS_Base}/backbtn_bg_on.png`}
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