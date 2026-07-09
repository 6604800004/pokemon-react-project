import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router';
import { type PokemonDetailData, type TypeDamageRelations } from "../data/pokemonData";
import { STAT_LABEL } from "../data/pokemonData";

function PokemonDetail() {
  const nav = useNavigate();
  const [genus, setGenus] = useState("");
  const [flavorText, setFlavorText] = useState("");
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({});
  const [data, setData] = useState<PokemonDetailData | null>(null);
  const { id } = useParams();
  const [prevPokemon, setPrevPokemon] = useState<{ id: number; name: string } | null>(null);
  const [nextPokemon, setNextPokemon] = useState<{ id: number; name: string } | null>(null);
  const toJsdelivr = (url: string) =>
    url.replace(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master",
      "https://cdn.jsdelivr.net/gh/PokeAPI/sprites"
    );

  useEffect(() => {
    if (!id) {
      nav("/404", { replace: true });
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      try {
        const numericId = parseInt(id, 10);
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${numericId}`);
        if (!res.ok) {
          if (!cancelled) nav("/404", { replace: true });
          return;
        }
        const json: PokemonDetailData = await res.json();
        if (cancelled) return;
        setData(json);

        const speciesRes = await fetch(json.species.url);
        const speciesJson = await speciesRes.json();
        if (cancelled) return;
        const thGenus = speciesJson.genera.find((g: { language: { name: string } }) => g.language.name === "th");
        const enGenus = speciesJson.genera.find((g: { language: { name: string } }) => g.language.name === "en");
        setGenus(thGenus?.genus ?? enGenus?.genus ?? "-");

        // ดึงชื่อโปเกมอนตัวก่อนหน้า/ถัดไป (ถ้ามี)
        const prevId = numericId - 1;
        const nextId = numericId + 1;

        if (prevId >= 1) {
          fetch(`https://pokeapi.co/api/v2/pokemon/${prevId}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((p) => { if (!cancelled && p) setPrevPokemon({ id: p.id, name: p.name }); })
            .catch(() => { });
        } else {
          setPrevPokemon(null);
        }

        fetch(`https://pokeapi.co/api/v2/pokemon/${nextId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((p) => { if (!cancelled && p) setNextPokemon({ id: p.id, name: p.name }); })
          .catch(() => setNextPokemon(null));

        // flavor text
        const thEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "th"
        );
        const enEntry = speciesJson.flavor_text_entries.find(
          (e: { language: { name: string } }) => e.language.name === "en"
        );
        const rawText = thEntry?.flavor_text ?? enEntry?.flavor_text ?? "";
        setFlavorText(rawText.replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim());

        // ดึง damage_relations ของแต่ละ type ทันทีหลังได้ data มา
        const typeResults: TypeDamageRelations[] = await Promise.all(
          json.types.map((t) => fetch(t.type.url).then((r) => r.json()))
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
    return () => { cancelled = true; };
  }, [id, nav]);

  if (!data) return null;

  const weaknessList = Object.entries(weaknesses)
    .filter(([, mult]) => mult > 1)
    .sort((a, b) => b[1] - a[1]);

  const spriteUrl = toJsdelivr(
    data.sprites.other["official-artwork"].front_default ?? data.sprites.front_default
  );

  const handlePreviousPokemon = () => {
    const prevId = data.id - 1;
    if (prevId >= 1) nav(`/PokeDex/${prevId.toString().padStart(4, "0")}`);
  };

  const handleNextPokemon = () => {
    const nextId = data.id + 1;
    nav(`/PokeDex/${nextId.toString().padStart(4, "0")}`);
  };

  const SEGMENT_COUNT = 15; // จำนวนขีดในแต่ละแท่ง
  const MAX_STAT_VALUE = 260;

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
              src="https://th.portal-pokemon.com/play/resources/pokedex/img/main_bg_v15.jpg"
              alt="Pokedex banner"
              className="w-full block"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
              <img
                src="https://th.portal-pokemon.com/play/resources/pokedex/img/pokemon_bg.png"
                className="h-auto object-cover object-center select-none animate-spin [animation-duration:3s]"
                aria-hidden="true"
              />
              <img
                src="https://th.portal-pokemon.com/play/resources/pokedex/img/pokemon_circle_bg.png"
                className="absolute h-auto object-cover object-center select-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ข้อมูลโปเกมอน */}
          {/* ID, ชื่อ, รูป */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-[560px]">
            <div className="relative w-[26%] h-[26%]">
              <img
                src={spriteUrl}
                alt={data.name}
                className="w-full h-full object-contain z-10"
              />
              <span className="absolute -top-[75px] left-1/2 -translate-x-1/2 text-[#b3eafe] text-[39px] z-20">
                {data.id.toString().padStart(4, "0")}
              </span>
              <span
    className="absolute -top-[30px] left-1/2 -translate-x-1/2 text-[#ffffff] text-[51px] font-bold z-40 whitespace-nowrap"
    style={{ textShadow: "0 0 3px #000, 2px 2px 7px #9be1ff, -2px -2px 7px #9be1ff" }}
>
    {data.name.replace(/-/g, " ").toUpperCase()}
</span>
            </div>
          </div>

          {/* ปุ่มเปลี่ยนโปเกมอน */}
          {/* ปุ่มซ้าย */}
          <div className="absolute top-[140px] left-0 z-30">
            <img
              src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_pc_left.png"
              alt=""
              className="w-[400px] object-contain"
            />
            <button
              onClick={handlePreviousPokemon}
              className="absolute top-3.5 left-11 pointer-events-auto cursor-pointer group"
            >
              <div className="relative w-[64px] h-[64px]">
                <img
                  src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_left_btn.png"
                  alt="โปเกมอนก่อนหน้า"
                />
                <img
                  src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_left_btn_on.png"
                  alt=""
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </button>
            {prevPokemon && (
              <div className="absolute top-3.5 left-[150px] text-white pointer-events-none whitespace-nowrap">
                <span className="text-[#b3eafe] text-[19px]">
                  {prevPokemon.id.toString().padStart(4, "0")}
                </span>
                <span className="text-[20px] capitalize ml-2">{prevPokemon.name.toUpperCase()}</span>
              </div>
            )}
          </div>
          {/* ปุ่มขวา */}
          <div className="absolute top-[140px] right-0 z-30">
            <img
              src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_pc_right.png"
              alt=""
              className="w-[380px] object-contain"
            />
            <button
              onClick={handleNextPokemon}
              className="absolute top-3.5 right-11 pointer-events-auto cursor-pointer group"
            >
              <div className="relative w-[64px] h-[64px]">
                <img
                  src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_right_btn.png"
                  alt="โปเกมอนถัดไป"
                />
                <img
                  src="https://th.portal-pokemon.com/play/resources/pokedex/img/arrow_right_btn_on.png"
                  alt=""
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </button>
            {nextPokemon && (
              <div className="absolute top-3.5 right-[150px] text-white pointer-events-none whitespace-nowrap text-right">
                <span className="text-[20px] capitalize mr-2">{nextPokemon.name.toUpperCase()}</span>
                <span className="text-[#b3eafe] text-[19px]">
                  {nextPokemon.id.toString().padStart(4, "0")}
                </span>
              </div>
            )}
          </div>

          {/* ประเภท, จุดอ่อน*/}
          <div className="absolute top-[280px] left-[7%] w-[260px] pointer-events-auto">
            {/* ประเภท */}
            <p className="text-[28px] text-white mb-3">ประเภท</p>
            <div className="flex flex-col gap-3">
              {data.types.map((t) => (
                <span
                  key={t.slot}
                  className={`type type--${t.type.name} capitalize w-full text-center`}
                >
                  {t.type.name}
                </span>
              ))}
            </div>

            {/* จุดอ่อน */}
            {weaknessList.length > 0 && (
              <div className="mt-6">
                <p className="text-[28px] text-white mb-3">จุดอ่อน</p>
                <div className="grid grid-cols-2 gap-3">
                  {weaknessList.map(([typeName]) => (
                    <span
                      key={typeName}
                      className={`type type--${typeName} capitalize w-full text-center`}
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ส่วนสูง */}
          <div className="absolute top-[350px] right-[7%] w-[290px] pointer-events-auto">
            <p className="text-[19px] text-[#b3eafe]">ส่วนสูง</p>
            <p className="text-[19px] text-[#ffffff]">{data.height / 10} m</p>
          </div>

          {/* ชนิด */}
          <div className="absolute top-[350px] right-[7%] w-[180px] pointer-events-auto">
            <p className="text-[19px] text-[#b3eafe]">ชนิด</p>
            <p className="text-[19px] text-[#ffffff]">{genus}</p>
          </div>

          {/* น้ำหนัก */}
          <div className="absolute top-[420px] right-[7%] w-[290px] pointer-events-auto">
            <p className="text-[19px] text-[#b3eafe]">น้ำหนัก</p>
            <p className="text-[19px] text-[#ffffff]">{data.weight / 10} kg</p>
          </div>

          {/* เพศ */}
          <div className="absolute top-[420px] right-[7%] w-[180px] pointer-events-auto">
            <p className="text-[19px] text-[#b3eafe]">เพศ</p>
            <div className="flex items-center gap-2 mt-1">
              <img src="https://th.portal-pokemon.com/play/resources/pokedex/img/icon_male.png" alt="ชาย" className="w-6 h-6 object-contain" />
              <span className="text-[#ffffff] text-[19px]">/</span>
              <img src="https://th.portal-pokemon.com/play/resources/pokedex/img/icon_female.png" alt="หญิง" className="w-6 h-6 object-contain" />
            </div>
          </div>

          {/* คุณสมบัติพิเศษ */}
          <div className="absolute top-[510px] right-[7%] w-[290px] pointer-events-auto">
            <p className="text-[19px] text-[#b3eafe]">คุณสมบัติพิเศษ</p>
            <div className="flex flex-col gap-1 mt-1">
              {data.abilities
                .filter((a) => !a.is_hidden)
                .map((a) => (
                  <p key={a.slot} className="text-[19px] text-[#ffffff] capitalize flex items-center gap-2">
                    {a.ability.name.replace(/-/g, " ")}
                    <img
                      src="https://th.portal-pokemon.com/play/resources/pokedex/img/icon_question.png"
                      alt="ข้อมูลเพิ่มเติม"
                      title={a.ability.name.replace(/-/g, " ")}
                      className="w-7 h-7 object-contain cursor-help"
                    />
                  </p>
                ))}
            </div>
          </div>

          {/* เวอร์ชัน */}
          <div className="absolute top-[725px] left-[6%]">
            <div className="flex items-center gap-4">
              <p className="text-[28px] text-[#b3eafe]">เวอร์ชัน</p>
              <div className="flex items-center gap-2">
                <img src="https://th.portal-pokemon.com/play/resources/pokedex/img/icon_ball_on.png" alt="Brilliant Diamond & Shining Pearl" className="w-[33px] h-[33px] object-contain" />
                <img src="https://th.portal-pokemon.com/play/resources/pokedex/img/icon_ball.png" alt="Sword & Shield" className="w-[33px] h-[33px] object-contain" />
              </div>
            </div>
          </div>
          {/* เวอร์ชัน-คำบรรยาย */}
          {flavorText && (
            <div className="absolute top-[770px] left-[6%] w-[400px] pointer-events-auto">
              <p className="text-[19px] text-[#ffffff] leading-relaxed whitespace-normal break-words">
                {flavorText}
              </p>
            </div>
          )}

          {/* ค่าพลัง */}
          <div className="absolute top-[725px] right-[20%] pointer-events-auto">
            <p className="text-[28px] text-[#b3eafe] ">ค่าพลัง</p>
          </div>

          <div className="absolute top-[800px] right-[2%] w-[600px] pointer-events-auto">
            <div className="grid grid-cols-6 gap-4">
              {data.stats.map((s) => {
                const percent = Math.min((s.base_stat / MAX_STAT_VALUE) * 100, 100);
                const filledSegments = Math.round((percent / 100) * SEGMENT_COUNT);

                return (
                  <div key={s.stat.name} className="flex flex-col items-center">
                    <div className="flex flex-col-reverse gap-[2px] w-full h-[180px]">
                      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                        <div
                          key={i}
                          className={
                            i < filledSegments
                              ? "flex-1 bg-[#5ec8f0] border border-[#b3eafe]"
                              : "flex-1 bg-transparent border border-[#2a4a5a]"
                          }
                        />
                      ))}
                    </div>
                    <span className="mt-2 text-[14px] text-white text-center">
                      {STAT_LABEL[s.stat.name] ?? s.stat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* กลับไป หน้าหลักโปเกเด็กซ์ */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center w-full max-w-[600px] h-20 mx-auto my-5">
            <button
              onClick={() => nav("/")}
              className="relative cursor-pointer group"
            >
              <img
                src="https://th.portal-pokemon.com/play/resources/pokedex/img/backbtn_bg.png"
                alt="หน้าหลักโปเกเด็กซ์"
              />
              <img
                src="https://th.portal-pokemon.com/play/resources/pokedex/img/backbtn_bg_on.png"
                alt=""
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
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