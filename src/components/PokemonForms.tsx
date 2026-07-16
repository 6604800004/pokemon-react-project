import { useEffect, useState } from "react";
import { CDN, RAW_URL, ASSETS_Base } from "../config";

const FORM_BG_EMPTY = `${ASSETS_Base}/style0_bg.png`;
const FORM_BG_CARD = `${ASSETS_Base}/style1_bg.png`;
const FORM_BG_POKEBALL = `${ASSETS_Base}/style_pokemon_bg.png`;

const toJsdelivr = (url: string) => url.replace(RAW_URL, CDN);

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

  const hasOtherForms = forms.length > 1;

  return (
    <div className="w-full">
      {!hasOtherForms ? (
        <div
          className="absolute top-[30px] left-1/2 -translate-x-1/2 right-0 w-[1400px] h-[150px]"
          style={{
            backgroundImage: `url(${FORM_BG_EMPTY})`,
            backgroundSize: "100% 100%",
          }}
        >
          <p className="absolute left-[4%] text-[28px] text-[#b3eafe]">ร่าง</p>
          <span className="absolute left-[6%] top-[60px] w-full text-left text-white text-[16px] font-['Noto_Sans']">
            ไม่มีร่างอื่น
          </span>
        </div>
      ) : (
        <div
          className="absolute top-[30px] left-1/2 -translate-x-1/2 right-0 w-[1400px] h-[500px]"
          style={{
            backgroundImage: `url(${FORM_BG_CARD})`,
            backgroundSize: "100% 100%",
          }}
        >
          <p className="absolute left-[4%] top-0 text-[28px] text-[#b3eafe] ">
            ร่าง
          </p>

          <div className="flex flex-wrap gap-0 px-[4%] font-['Noto_Sans', Arial, sans-serif] ">
            {forms.map((f) => (
              <div key={f.id} className="flex flex-col items-center w-[20%]">
                {/* Sprite ในวงกลม */}
                <div
                  className="relative top-[15%] w-[180%] h-[180%] flex items-center justify-center bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${FORM_BG_POKEBALL})` }}
                >
                  <img
                    src={f.sprite}
                    alt={f.name}
                    className="w-[80%] h-[58%] object-contain relative -top-20 [filter:drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_2px_#ffffff)]"
                  />
                </div>

                {/* ID */}
                <span className="relative -top-[15%] text-[#b3eafe] text-[18px] font-['Noto_Sans', Arial, sans-serif]">
                  {f.id.toString().padStart(4, "0")}
                </span>

                {/* ชื่อ */}
                <span className="relative -top-[17%] text-white text-[22px] text-center capitalize min-h-[48px] flex items-center justify-center leading-tight px-1">
                  {f.name.replace(/-/g, " ")}
                </span>

                {/* ประเภท */}
                <div className="relative -top-[12%] flex w-full gap-2 justify-center">
                  {f.types.map((t) => (
                    <span
                      key={t}
                      className={`type type--${t} capitalize !text-[15px] !px-6 !py-1 !rounded-full`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PokemonForms;
