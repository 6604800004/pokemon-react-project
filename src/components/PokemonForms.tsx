import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CDN, API_Base } from "../config";

// พื้นหลังการ์ดกรณีไม่มีร่างอื่น
const FORM_BG_EMPTY = "/src/assets/img/style0_bg.png";
// พื้นหลังการ์ดกรณีมีร่างอื่น
const FORM_BG_CARD = "/src/assets/img/style1_bg.png";
// พื้นหลังวงกลมหลังรูปโปเกมอนแต่ละร่าง
const FORM_BG_POKEBALL = "/src/assets/img/style_pokemon_bg.png";
// พื้นหลังวงกลมหลังรูปโปเกมอนในสายวิวัฒนาการ
const FORM_BG_EVO = "/src/assets/img/evolutions_pokemon_bg.png";

// เปลี่ยน url รูปจาก raw github ไปใช้ CDN แทนเพื่อโหลดเร็วขึ้น
const toJsdelivr = (url: string) => url.replace(API_Base, CDN);

// ร่างของโปเกมอนตัวหนึ่งตามที่ species ส่งมา
type SpeciesVariety = {
  is_default: boolean;
  pokemon: { name: string; url: string };
};

// ข้อมูลที่ใช้แสดงผลของแต่ละร่าง/วิวัฒนาการ
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

// แปลงข้อมูลดิบจาก PokeAPI (ที่มีฟิลด์เยอะมาก) ให้เหลือแค่ id, ชื่อ, รูป, type ที่การ์ดต้องใช้แสดงผล
const mapForm = (p: any): FormData => ({
  id: p.id,
  name: p.name,
  // ใช้รูปวาดทางการก่อน ถ้าไม่มี (บางร่างไม่มีรูปนี้) ค่อย fallback เป็นรูป sprite ปกติ
  sprite: toJsdelivr(
    p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
  ),
  types: p.types.map((t: { type: { name: string } }) => t.type.name),
});

// evolution chain ของ PokeAPI เป็นโครงสร้างต้นไม้ (ตัวหนึ่งวิวัฒนาการเป็นได้หลายตัว)
// ฟังก์ชันนี้เดินไล่ทีละ node แล้วเก็บชื่อใส่ names เรียงตามลำดับ (ร่างแรก -> ร่างที่วิวัฒนาการมาจากมัน -> ...)
const flattenChain = (node: any, names: string[] = []): string[] => {
  names.push(node.species.name);
  node.evolves_to.forEach((child: any) => flattenChain(child, names));
  return names;
};

function PokemonForms({
  varieties,
  evolutionChainUrl,
  speciesId,
}: PokemonFormsProps) {
  const nav = useNavigate(); // ใช้เปลี่ยนหน้าเมื่อกดการ์ดร่างหรือวิวัฒนาการ
  const [forms, setForms] = useState<FormData[]>([]); // ร่างอื่น ๆ ของโปเกมอนตัวนี้ (เช่น mega, alola)
  const [evolutions, setEvolutions] = useState<FormData[]>([]); // สายวิวัฒนาการของโปเกมอนตัวนี้
  const [loading, setLoading] = useState(true); // กำลังโหลดข้อมูลร่างและวิวัฒนาการอยู่หรือไม่

  useEffect(() => {
    let cancelled = false; // กันไม่ให้ setState หลัง component unmount หรือ props เปลี่ยนไปแล้ว
    setLoading(true);

    // โหลดข้อมูลของทุกร่างใน varieties
    const fetchForms = async () => {
      try {
        const varietyResults = await Promise.all(
          varieties.map((v) => fetch(v.pokemon.url).then((res) => res.json())),
        ); // ข้อมูลดิบของทุกร่าง (ยังไม่ผ่าน mapForm)
        if (!cancelled) setForms(varietyResults.map(mapForm));
      } catch {
        if (!cancelled) setForms([]);
      }
    };

    // โหลดข้อมูลสายวิวัฒนาการทั้งหมดจาก evolutionChainUrl
    const fetchEvolutions = async () => {
      if (!evolutionChainUrl) {
        if (!cancelled) setEvolutions([]);
        return;
      }
      try {
        const chainJson = await fetch(evolutionChainUrl).then((res) =>
          res.json(),
        ); // โครงสร้างต้นไม้ของสายวิวัฒนาการแบบเต็ม
        const evoNames = flattenChain(chainJson.chain); // รายชื่อทุกตัวในสายวิวัฒนาการ เรียงตามลำดับ
        // แทรก raichu-alola ต่อจาก raichu เพราะ evolution chain ของ PokeAPI ไม่มีร่างนี้ให้
        const raichuIndex = evoNames.indexOf("raichu"); // ตำแหน่งของ raichu ในลิสต์ (-1 ถ้าไม่มี)
        if (raichuIndex !== -1) {
          evoNames.splice(raichuIndex + 1, 0, "raichu-alola");
        }
        const evoResults = await Promise.all(
          evoNames.map((name) =>
            fetch(`${API_Base}/pokemon/${name}`).then((res) => res.json()),
          ),
        ); // ข้อมูลดิบของทุกตัวในสายวิวัฒนาการ (ยังไม่ผ่าน mapForm)
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

  const hasOtherForms = forms.length > 1; // มีมากกว่า 1 ร่างถึงจะนับว่ามี "ร่างอื่น"

  return (
    <div className="w-full relative">
      {evolutions.length > 1 ? (
        <div
          className={`z-50 absolute right-0 h-[400px] flex flex-row items-center gap-3 text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-10 pr-[7%] rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[150px]"
          }`}
        >
          <div className="flex items-center h-[100%] mr-12">
            <span className="text-[160%] whitespace-nowrap">
              วิวัฒนาการโปเกมอน
            </span>
          </div>

          {evolutions.map((f, index) => (
            <div key={f.id} className="flex items-center gap-3 shrink-0">
              {index > 0 && (
                <img
                  src="\src\assets\img\arrow_down.png"
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

                <span className="text-[18px] text-center mt-1 font-['Noto_Sans',_Arial,_sans-serif]">
                  {(f.name === "raichu-alola" ? 26 : f.id)
                    .toString()
                    .padStart(4, "0")}
                </span>

                <span className="text-[20px] font-['Noto_Sans',_Arial,_sans-serif] capitalize text-center flex items-center justify-center leading-tight">
                  {f.name.replace(/-/g, " ")}
                </span>

                <div className="flex flex-col gap-2 mt-2 justify-start">
                  {f.types.map((t) => (
                    <span
                      key={t}
                      className={`type type--${t} capitalize !text-center !text-[100%] !font-['Noto_Sans',_Arial,_sans-serif] `}
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
          className={`z-50 absolute right-0 flex flex-row items-center gap-3 text-[#b3eafe] border-2 w-fit border-[#466e9b] bg-[#0a141e] py-6 pl-8 pr-10 rounded-s-full ${
            hasOtherForms ? "top-[500px]" : "top-[110px]"
          }`}
        >
          <div>
            <span className="text-[160%] whitespace-nowrap">
              วิวัฒนาการโปเกมอน
            </span>
          </div>

          <div>
            <p className="text-[100%] text-[#ffffff] h-5">
              ไม่มีวิวัฒนาการโปเกมอน
            </p>
          </div>
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
          <div>
            <p className="absolute left-[4%] text-[180%] text-[#b3eafe]">
              ร่าง
            </p>
          </div>

          <div>
            <span className="absolute left-[6%] top-[50%] w-full text-left text-white text-[16px] font-['Noto_Sans']">
              ไม่มีร่างอื่น
            </span>
          </div>
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
