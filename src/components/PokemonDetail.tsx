import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router';
import { type PokemonDetailData, type TypeDamageRelations } from "../data/pokemonData";

function PokemonDetail() {
  const nav = useNavigate();
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({});
  const [data, setData] = useState<PokemonDetailData | null>(null);
  const { id } = useParams();

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
                src={data.sprites.other["official-artwork"].front_default ?? data.sprites.front_default}
                alt={data.name}
                className="w-full h-full object-contain z-10"
              />
              <span className="absolute -top-[70px] left-1/2 -translate-x-1/2 text-[#b3eafe] text-[28px] z-20">
                {data.id.toString().padStart(4, "0")}
              </span>
              <span
                className="absolute -top-[30px] left-1/2 -translate-x-1/2 text-[#ffffff] text-[28px] font-bold z-20"
                style={{ textShadow: "0 0 3px #000, 2px 2px 7px #9be1ff, -2px -2px 7px #9be1ff" }}
              >
                {data.name.toString().toUpperCase().padStart(4, "0")}
              </span>
            </div>
          </div>

          {/* ประเภท, จุดอ่อน*/}
          <div className="absolute top-[120px] right-[20%] w-[400px] pointer-events-auto">
            {/* ประเภท */}
            <p className="text-sm text-gray-300 mb-1">ประเภท</p>
            <div className="flex gap-6 mt-2">
              {data.types.map((t) => (
                <span
                  key={t.slot}
                  className={`type type--${t.type.name} capitalize`}
                >
                  {t.type.name}
                </span>
              ))}
            </div>

            {/* จุดอ่อน */}
            {weaknessList.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-300 mb-1">จุดอ่อน</p>
                <div className="flex flex-wrap gap-2">
                  {weaknessList.map(([typeName]) => (
                    <span
                      key={typeName}
                      className={`type type--${typeName} capitalize`}
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
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