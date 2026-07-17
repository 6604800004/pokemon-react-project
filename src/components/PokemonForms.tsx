import { useEffect, useState } from "react";
import { CDN, RAW_URL, ASSETS_Base } from "../config";

const FORM_BG_EMPTY = `${ASSETS_Base}/style0_bg.png`;
const FORM_BG_CARD = `${ASSETS_Base}/style1_bg.png`;
const FORM_BG_POKEBALL = `${ASSETS_Base}/style_pokemon_bg.png`;
const FORM_BG_EVO = `${ASSETS_Base}/evolutions_pokemon_bg.png`;

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
  evolutionChainUrl: string;
};

const mapForm = (p: any): FormData => ({
  id: p.id,
  name: p.name,
  sprite: toJsdelivr(
    p.sprites.other["official-artwork"].front_default ?? p.sprites.front_default,
  ),
  types: p.types.map((t: { type: { name: string } }) => t.type.name),
});

const flattenChain = (node: any, names: string[] = []): string[] => {
  names.push(node.species.name);
  node.evolves_to.forEach((child: any) => flattenChain(child, names));
  return names;
};

function PokemonForms({ varieties, evolutionChainUrl }: PokemonFormsProps) {
  const [forms, setForms] = useState<FormData[]>([]);
  const [evolutions, setEvolutions] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchForms = async () => {
      try {
        const varietyResults = await Promise.all(
          varieties.map((v) => fetch(v.pokemon.url).then((res) => res.json())),
        );
        if (!cancelled) setForms(varietyResults.map(mapForm));
      } catch {
        if (!cancelled) setForms([]);
      }
    };

    const fetchEvolutions = async () => {
      if (!evolutionChainUrl) {
        if (!cancelled) setEvolutions([]);
        return;
      }
      try {
        const chainJson = await fetch(evolutionChainUrl).then((res) => res.json());
        const evoNames = flattenChain(chainJson.chain);
        const evoResults = await Promise.all(
          evoNames.map((name) =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then((res) => res.json()),
          ),
        );
        if (!cancelled) setEvolutions(evoResults.map(mapForm));
      } catch {
        if (!cancelled) setEvolutions([]);
      }
    };

    Promise.all([fetchForms(), fetchEvolutions()]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [varieties, evolutionChainUrl]);

  if (loading) return null;

  const hasOtherForms = forms.length > 1;

  return (
    <div className="w-full relative">
      {evolutions.length > 1 ? (
        <div
          className= {`z-50 absolute right-0 h-[350px] max-w-[750px] flex flex-row items-center gap-4 text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-8 pr-10 rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[150px]"
          }`}
        >
          <div>
            <span className="text-[160%] whitespace-nowrap">วิวัฒนาการโปเกมอน</span>
          </div>

          {evolutions.map((f) => (
            <div key={f.id} className="flex flex-col items-center shrink-0">
              <div
                className="w-[130px] h-[130px] flex items-center justify-center bg-contain bg-center bg-no-repeat shrink-0"
                style={{ backgroundImage: `url(${FORM_BG_EVO})` }}
              >
                <img
                  src={f.sprite}
                  alt={f.name}
                  className="w-[70%] h-[70%] object-contain [filter:drop-shadow(0_0_0.5px_#ffffff)_drop-shadow(0_0_0.5px_#ffffff)_drop-shadow(0_0_1px_#ffffff)]"
                />
              </div>

              <span className="text-[13px] mt-1">
                {f.id.toString().padStart(4, "0")}
              </span>

              <span className="text-[14px] capitalize text-center min-h-[36px] flex items-center justify-center leading-tight px-1">
                {f.name.replace(/-/g, " ")}
              </span>

              <div className="flex flex-col gap-1 items-center mt-1 min-h-[56px] justify-start">
                {f.types.map((t) => (
                  <span
                    key={t}
                    className={`type type--${t} !text-[11px] !px-2 !py-0.5 w-[70px] text-center`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
         <div
          className={`z-50 absolute right-0 flex flex-row items-center gap-4 text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-8 pr-10 rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[150px]"
          }`}
        >
            <span className="text-[160%] whitespace-nowrap">
              วิวัฒนาการโปเกมอน</span>
              <p className="text-[100%] text-[#ffffff] h-5" >ไม่มีวิวัฒนาการโปเกมอน</p>
          </div>
      )}

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
          <p className="absolute left-[4%] top-0 text-[28px] text-[#b3eafe]">
            ร่าง
          </p>

          <div className="flex flex-wrap gap-0 px-[4%] font-['Noto_Sans',_Arial,_sans-serif]">
            {forms.map((f) => (
              <div key={f.id} className="flex flex-col items-center w-[20%]">
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

                <span className="relative -top-[15%] text-[#b3eafe] text-[18px] font-['Noto_Sans',_Arial,_sans-serif]">
                  {f.id.toString().padStart(4, "0")}
                </span>

                <span className="relative -top-[17%] text-white text-[22px] text-center capitalize min-h-[48px] flex items-center justify-center leading-tight px-1">
                  {f.name.replace(/-/g, " ")}
                </span>

                <div className="relative -top-[12%] flex w-full gap-2 justify-center">
                  {f.types.map((t) => (
                    <span
                      key={t}
                      className={`type type--${t} capitalize !text-[15px] !px-5 !py-1 !rounded-full`}
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