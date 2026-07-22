import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CDN, RAW_URL, ASSETS_Base,OR_URL } from "../config";

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
  speciesId: number;
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

function PokemonForms({ varieties, evolutionChainUrl, speciesId }: PokemonFormsProps) {
  const nav = useNavigate();
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
        const raichuIndex = evoNames.indexOf("raichu");
        if (raichuIndex !== -1) {
          evoNames.splice(raichuIndex + 1, 0, "raichu-alola");
        }
        const evoResults = await Promise.all(
          evoNames.map((name) =>
            fetch(`${OR_URL}/${name}`).then((res) => res.json()),
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
          className= {`z-50 absolute right-0 h-[400px] flex flex-row items-center gap-[2%] text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-10 pr-[7%] rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[150px]"
          }`}
        >
          <div className="flex items-center h-[100%] mr-8">
            <span className="text-[160%] whitespace-nowrap">วิวัฒนาการโปเกมอน</span>
          </div>

          {evolutions.map((f, index) => (
            <div key={f.id} className="flex items-center gap-4 shrink-0">
              {index > 0 && (
                <img
                  src={`${ASSETS_Base}/arrow_down.png`}
                  alt=""
                  className="w-7 h-7 object-contain rotate-[-90deg] shrink-0"
                  aria-hidden="true"
                />
              )}
              <div
                onClick={() => nav(`/PokeDex/${f.name}`)}
                className={`flex flex-col items-center shrink-0 cursor-pointer ${
                  f.types.length > 1 ? "mt-9" : ""
                }`}
              >
                <div
                  className="w-[130px] h-[130px] flex items-center justify-center bg-contain bg-center bg-no-repeat shrink-0"
                  style={{ backgroundImage: `url(${FORM_BG_EVO})` }}
                >
                  <img
                    src={f.sprite}
                    alt={f.name}
                    className="w-[80%] h-[80%] object-contain [filter:drop-shadow(0_0_0.5px_#ffffff)_drop-shadow(0_0_0.5px_#ffffff)_drop-shadow(0_0_1px_#ffffff)]"
                  />
                </div>

                <span className="text-[18px] text-center mt-1">
                  {(f.name === "raichu-alola" ? 26 : f.id).toString().padStart(4, "0")}
                </span>

                <span className="text-[20px] font-['Noto_Sans'] capitalize text-center flex items-center justify-center leading-tight">
                  {f.name.replace(/-/g, " ")}
                </span>

                <div className="flex flex-col gap-2 mt-2 justify-start">
                  {f.types.map((t) => (
                    <span
                      key={t}
                      className={`type type--${t} capitalize !text-center !text-[100%] `}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
         <div
          className={`z-50 absolute right-0 flex flex-row items-center text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-8 pr-10 rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[110px]"
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
          <p className="absolute left-[4%] text-[180%] text-[#b3eafe]">ร่าง</p>
          <span className="absolute left-[6%] top-[50%] w-full text-left text-white text-[16px] font-['Noto_Sans']">
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
          <p className="absolute left-[4%] top-[0%] text-[180%] text-[#b3eafe]">
            ร่าง
          </p>

          <div className="flex flex-wrap gap-0 px-[4%] font-['Noto_Sans',_Arial,_sans-serif]">
            {forms.map((f) => (
              <div
                key={f.id}
                onClick={() => nav(`/PokeDex/${f.name}`)}
                className="flex flex-col items-center w-[20%] cursor-pointer"
              >
                <div
                  className="relative top-[15%] w-[180%] h-[180%] flex items-center justify-center bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${FORM_BG_POKEBALL})` }}
                >
                  <img
                    src={f.sprite}
                    alt={f.name}
                    className="w-[80%] h-[58%] object-contain relative -top-[20%] [filter:drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_2px_#ffffff)]"
                  />
                </div>

                <span className="relative -top-[15%] text-[#b3eafe] text-[18px] font-['Noto_Sans',_Arial,_sans-serif]">
                  {speciesId.toString().padStart(4, "0")}
                </span>

                <span className="relative -top-[17%] text-white text-[22px] text-center capitalize min-h-[48px] flex items-center justify-center leading-tight px-1">
                  {f.name.replace(/-/g, " ")}
                </span>

                <div className="relative -top-[12%] flex w-full gap-2 justify-center">
                  {f.types.map((t) => (
                    <span
                      key={t}
                      className={`type type--${t} capitalize !text-center !px-5 !py-1 !w-[35%]`}
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