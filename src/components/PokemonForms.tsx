import { useEffect, useState } from "react";
import { CDN, RAW_URL, ASSETS_Base } from "../config";
                        
const FORM_BG_EMPTY = `${ASSETS_Base}/style0_bg.png`;
const FORM_BG_CARD = `${ASSETS_Base}/style1_bg.png`;
const FORM_BG_POKEBALL = `${ASSETS_Base}/style_pokemon_bg.png`;

const toJsdelivr = (url: string) =>
  url.replace(
    RAW_URL,
    CDN,
  );

type SpeciesVariety = {
  is_default: boolean;
  pokemon: { name: string; url: string };
};

type FormData = {
  id: number;
  name: string;
  sprite: string;
  types: string[];
};

type PokemonFormsProps = {
  varieties: SpeciesVariety[];
};

function PokemonForms({ varieties }: PokemonFormsProps) {
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchForms = async () => {
      try {
        // ดึงข้อมูลทุก variety พร้อมกัน (Promise.all เร็วกว่า loop fetch ทีละตัว)
        const results = await Promise.all(
          varieties.map((v) => fetch(v.pokemon.url).then((res) => res.json())),
        );
        if (cancelled) return;

        const mapped: FormData[] = results.map((p) => ({
          id: p.id,
          name: p.name,
          sprite: toJsdelivr(
            p.sprites.other["official-artwork"].front_default ??
              p.sprites.front_default,
          ),
          types: p.types.map((t: { type: { name: string } }) => t.type.name),
        }));

        setForms(mapped);
      } catch {
        if (!cancelled) setForms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchForms();
    return () => {
      cancelled = true;
    };
  }, [varieties]);

  if (loading) return null;

  // มีมากกว่า 1 variety แปลว่ามีร่างอื่นนอกจากร่างปกติ
  const hasOtherForms = forms.length > 1;

  return (
    <div className="w-full">
      <div className="inline-flex items-center h-[44px] px-6 rounded-full bg-[#0d1620] border border-[#2a4a5a] text-[#b3eafe] text-[20px]">
        ร่าง
      </div>

      {!hasOtherForms ? (
        <div
          className="mt-2 w-full min-h-[70px] flex items-center px-6 bg-cover bg-center rounded-2xl"
          style={{ backgroundImage: `url(${FORM_BG_EMPTY})` }}
        >
          <span className="text-white text-[14px]">ไม่มีร่างอื่น</span>
        </div>
      ) : (
        <div
          className="mt-2 w-full flex flex-wrap gap-8 p-6 bg-cover bg-center rounded-2xl"
          style={{ backgroundImage: `url(${FORM_BG_CARD})` }}
        >
          {forms.map((f) => (
            <div key={f.id} className="flex flex-col items-center w-[160px]">
              <div
                className="relative w-[160px] h-[160px] flex items-center justify-center bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${FORM_BG_POKEBALL})` }}
              >
                <img
                  src={f.sprite}
                  alt={f.name}
                  className="w-[70%] h-[70%] object-contain"
                />
              </div>

              <span className="mt-2 text-[#b3eafe] text-[16px]">
                {f.id.toString().padStart(4, "0")}
              </span>
              <span className="text-white text-[16px] text-center capitalize">
                {f.name.replace(/-/g, " ")}
              </span>

              <div className="flex gap-2 mt-2">
                {f.types.map((t) => (
                  <span
                    key={t}
                    className={`type type--${t} capitalize text-[12px] px-3 py-1 rounded-full`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PokemonForms;