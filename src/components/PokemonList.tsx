import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { API_Base } from "../config";
import { getPokemonId, BuildPokemon, type Tdata } from "../data/pokemonData";
import RandomPokemonBalls from "./Randompokemon";

//Search
const filterInput = (list: Tdata[], keyword: string) => {
  const key = keyword.toLowerCase().trim(); // คำค้นหาแบบตัดช่องว่างและปรับเป็นพิมพ์เล็กแล้ว
  if (!key) return list;
  return list.filter(
    (pokemon) =>
      //พิมพ์เลข เพิ่ม 0 ข้างหน้า ให้ครบ 4 ตัว
      pokemon.id.padStart(4, "0").includes(key) ||
      //พิมพ์ชื่อ ปรับเป็นพิมพ์เล็ก
      pokemon.name.toLowerCase().includes(key) ||
      //พิมพ์ type ปรับ type เป็นพิมพ์เล็ก
      pokemon.types.some((type) => type.toLowerCase().includes(key)),
  );
};

// รวมข้อมูลเก่ากับข้อมูลใหม่ ตัดตัวซ้ำด้วยชื่อ แล้วเรียงตาม id
const mergeData = (prev: Tdata[], incoming: Tdata[]) => {
  const map = new Map(prev.map((pokemon) => [pokemon.name, pokemon])); // ข้อมูลเก่าเก็บเป็น map คีย์ชื่อ ไว้เช็คซ้ำเร็ว ๆ
  incoming.forEach(
    (pokemon) => !map.has(pokemon.name) && map.set(pokemon.name, pokemon),
  );
  return [...map.values()].sort((a, b) => +a.id - +b.id);
};

// ดึงข้อมูลโปเกมอนทีละชุด (20 ตัว) เริ่มจาก offset ที่กำหนด
// ต้องยิง species ก่อนเพื่อกรองร่างที่ต้องการ (BuildPokemon) แล้วค่อยยิง pokemon เพื่อเอา type/sprite
const fetchBatch = async (offset: number) => {
  const list = await fetch(
    `${API_Base}/pokemon-species?limit=20&offset=${offset}`,
  ).then((res) => res.json()); // รายชื่อ species 20 ตัวในหน้านี้ (แค่ชื่อกับ url ยังไม่มีรายละเอียด)

  const allSpecies = await Promise.all(
    list.results.map((species: { url: string }) =>
      fetch(species.url).then((res) => res.json()),
    ),
  ); // ข้อมูล species แบบเต็มของทั้ง 20 ตัว (มีรายชื่อร่างของแต่ละตัว)

  // แต่ละ species อาจมีหลายร่าง (varieties) เอาเฉพาะร่างที่ BuildPokemon กรองผ่าน แล้วทำให้แบนเป็น array เดียว (flatMap)
  // เก็บ speciesUrl ติดไปด้วยเพราะต้องใช้หาเลขเด็กซ์ (id) ทีหลัง
  const entries = allSpecies.flatMap((species, index) =>
    species.varieties
      .filter(
        (varieties: { pokemon: { name: string }; is_default: boolean }) =>
          BuildPokemon(varieties.pokemon.name, varieties.is_default)
      )
      .map((varieties: { pokemon: { name: string; url: string } }) => ({
        name: varieties.pokemon.name,
        url: varieties.pokemon.url,
        speciesUrl: list.results[index].url,
      })),
  );

  // ยิง fetch อีกรอบต่อร่าง เพื่อเอา type และรูปภาพมาประกอบเป็นข้อมูลที่การ์ดใช้แสดงผล
  const newData = await Promise.all(
    entries.map((e: { name: string; url: string; speciesUrl: string }) =>
      fetch(e.url)
        .then((res) => res.json())
        .then((data) => ({
          name: e.name,
          url: e.url,
          id: getPokemonId(e.speciesUrl),
          types: data.types.map((t: { type: { name: string } }) => t.type.name),
          sprite:
            data.sprites?.other?.["official-artwork"]?.front_default ?? "",
        })),
    ),
  );

  return { newData, hasNext: !!list.next }; // hasNext บอกว่ายังมีข้อมูลให้โหลดเพิ่มจาก API อีกหรือไม่
};

function PokemonList() {
  const nav = useNavigate(); // ใช้เปลี่ยนหน้าไปหน้ารายละเอียดเมื่อกดการ์ดโปเกมอน
  const [searchParams] = useSearchParams(); // query string ของ url ปัจจุบัน (ใช้อ่านค่า ?type=)
  const initialType = searchParams.get("type") ?? ""; // มาจากการกด type ในหน้ารายละเอียด เช่น ?type=fire
  const [data, setData] = useState<Tdata[]>([]); // โปเกมอนทั้งหมดที่โหลดมาแล้ว (สะสมไปเรื่อย ๆ)
  const [inputText, setInputText] = useState(""); // ข้อความในช่อง input ตอนพิมพ์
  const [searchKeyword, setSearchKeyword] = useState(initialType); // คำค้นหาที่ยืนยันแล้ว (กด Enter/ปุ่มค้นหา)
  const [visibleCount, setVisibleCount] = useState(16); // จำนวนการ์ดที่แสดงตอนนี้
  const [hasMore, setHasMore] = useState(true); // ยังมีข้อมูลให้โหลดเพิ่มจาก API หรือไม่
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false); // กันไม่ให้ยิง fetch ครั้งแรกซ้ำจาก StrictMode
  const offsetRef = useRef(0); // offset ล่าสุดที่โหลดจาก API แล้ว
  const isFetching = useRef(false); // กันการยิง fetch ซ้อนกันหลายครั้งพร้อมกัน
  const dataRef = useRef<Tdata[]>([]); // เก็บ data ล่าสุดแบบ sync ไว้ใช้ใน closure ของฟังก์ชัน fetch

  // กรองข้อมูลตามคำค้นหาปัจจุบัน
  const filteredData = useMemo(
    () => filterInput(data, searchKeyword),
    [data, searchKeyword],
  );
  // ตัดมาแสดงเฉพาะเท่าที่ visibleCount กำหนด (infinite scroll แบบกดปุ่ม)
  const visibleData = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount],
  );
  const hasMoreCached = visibleCount < filteredData.length; // ข้อมูลที่มีอยู่แล้วยังพอให้เลื่อนดูต่อ ไม่ต้องยิง API
  const showLoadMore = !loading && (hasMoreCached || hasMore); // ควรโชว์ปุ่ม "ค้นหาเพิ่มเติม" หรือไม่

  // ห่อการเรียก fetch ให้มี loading state และกันการยิงซ้อน
  const withFetch = async (fn: () => Promise<void>) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // อัปเดตทั้ง state และ ref ให้ตรงกันหลังได้ข้อมูลชุดใหม่มา
  const applyBatch = (merged: Tdata[], hasNext: boolean) => {
    if (!hasNext) setHasMore(false);
    dataRef.current = merged;
    setData([...merged]);
  };

  // โหลดข้อมูลชุดถัดไปจาก API ที่ offset ที่กำหนด แล้ว merge เข้ากับของเดิม
  const fetchSpecies = (offset: number) =>
    withFetch(async () => {
      const { newData, hasNext } = await fetchBatch(offset);
      offsetRef.current = offset;
      applyBatch(mergeData(dataRef.current, newData), hasNext);
    });

  // โหลดข้อมูลเพิ่มไปเรื่อย ๆ จนกว่าผลลัพธ์ที่ค้นหาเจอจะครบตามจำนวนที่ต้องการ (หรือ API หมดแล้ว)
  const fetchUntilEnough = (keyword: string, needed: number) =>
    withFetch(async () => {
      let cur = [...dataRef.current];
      while (filterInput(cur, keyword).length < needed) {
        const next = offsetRef.current + 20;
        const { newData, hasNext } = await fetchBatch(next);
        offsetRef.current = next;
        cur = mergeData(cur, newData);
        applyBatch(cur, hasNext);
        if (!hasNext) break;
      }
    });

  // กดค้นหา: ตั้งคำค้นหาใหม่ รีเซ็ตจำนวนที่แสดง แล้วโหลดเพิ่มถ้าผลลัพธ์ที่มียังไม่พอ
  const handleSearch = () => {
    const keyword = inputText.trim();
    if (keyword === searchKeyword) return;
    setSearchKeyword(keyword);
    setVisibleCount(16);
    if (keyword && filterInput(dataRef.current, keyword).length < 16)
      fetchUntilEnough(keyword, 16);
  };

  // กด "ค้นหาเพิ่มเติม": โชว์เพิ่มจากของที่มีอยู่ก่อน ถ้าไม่พอค่อยยิง API เพิ่ม
  const loadMore = () => {
    if (loading || isFetching.current) return;
    const next = visibleCount + 16; // จำนวนการ์ดที่ต้องการให้แสดงหลังกดปุ่ม
    if (searchKeyword) {
      if (filteredData.length >= next || !hasMore) setVisibleCount(next);
      else
        fetchUntilEnough(searchKeyword, next).then(() => setVisibleCount(next));
    } else {
      if (hasMoreCached) setVisibleCount(next);
      else if (hasMore)
        fetchSpecies(offsetRef.current + 20).then(() => setVisibleCount(next));
    }
  };

  // โหลดข้อมูลชุดแรกตอนเปิดหน้า และถ้ามาจากการกด type ให้โหลดจนกว่าจะมีผลลัพธ์พอแสดง
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSpecies(0).then(() => {
      if (
        initialType &&
        filterInput(dataRef.current, initialType).length < 16
      ) {
        fetchUntilEnough(initialType, 16);
      }
    });
  }, []);

  return (
    <>
      <header className="flex items-center justify-center min-h-[60px] bg-white z-40">
        <div className="logo__ z-40" />
      </header>

      <div className="bg-[#1b252f]">
        <div className="relative max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden">
            <div
              onClick={() => {
                setInputText("");
                setSearchKeyword("");
                setVisibleCount(16);
                nav("/PokeDex");
              }}
              className="absolute cursor-pointer top-10 left-1/2 -translate-x-1/2 text-[28px] text-black z-40 whitespace-nowrap px-[200px]"
            >
              โปเกเด็กซ์
            </div>

            <img
              src="src\assets\img\list_top_bg.jpg"
              alt="Pokedex banner"
              className="w-full block"
            />

            <img
              src="src\assets\img\pokedex_bg.png"
              className="absolute inset-0 w-auto h-auto object-cover object-center pointer-events-none select-none z-20"
              aria-hidden="true"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-7">
              <img
                src="src\assets\img\pokemon_list_bg.png"
                className="w-[1350px] h-[550px] object-cover object-center select-none animate-spin [animation-duration:3s]"
                aria-hidden="true"
              />
            </div>

            <div className="absolute bottom-[150px] left-[150px] right-10 z-10">
              <div className="search-panel absolute">
                {/* วงกลม สุ่มรอบช่องค้นหา */}
                <div>
                  <RandomPokemonBalls />
                </div>

                {/* คำอธิบายช่องค้นหา */}
                <div>
                  <p className="text-[#b3eafe] text-xl pb-4 pl-1 [filter:drop-shadow(0_0_5px_#fdfdfd)]">
                    ค้นหาด้วยชื่อ หรือ หมายเลขโปเกเด็กซ์
                  </p>
                </div>

                {/* ช่องค้นหา + ปุ่มค้นหา */}
                <div>
                  <div className="flex rounded-full overflow-hidden bg-white shadow-lg [filter:drop-shadow(0_0_2px_#fdfdfd)]">
                    <input
                      type="text"
                      value={inputText}
                      className="search-input flex-1 min-w-0 py-2 pl-[50px] pr-[280px] text-[22px] border-none outline-none bg-white"
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    <button
                      onClick={handleSearch}
                      className="flex items-center justify-center w-[100px] bg-[#b3eafe] border-none cursor-pointer shrink-0 transition-colors"
                    >
                      <img
                        src="src\assets\img\icon_magnifying_glass.png"
                        alt="search"
                        className="w-7 h-7 object-contain"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="list-section-bg relative max-w-[1400px] gap-5 w-full mx-auto px-10 pt-5 pb-10 min-h-screen">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 font-[Noto_Sans,Arial,sans-serif]">
            {visibleData.map((pokemon) => (
              <div
                key={pokemon.name}
                onClick={() => nav(`/PokeDex/${pokemon.name}`)}
                className="pokemon-card-bg flex flex-col items-center cursor-pointer overflow-hidden relative rounded-lg"
                style={{ aspectRatio: "2 / 3" }}
              >
                <img
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  className="w-[60%] h-[60%] object-contain p-[5px] [filter:drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_1px_#ffffff)_drop-shadow(0_0_2px_#ffffff)]"
                />
                <div className="flex flex-col w-[75%] gap-2 flex-1 font-semibold">
                  <span className="text-[#b3eafe] text-[18px]">
                    {pokemon.id.padStart(4, "0")}
                  </span>
                  <span className="font-bold text-[22px] text-white leading-tight whitespace-pre-line">
                    {pokemon.name
                      .toUpperCase()
                      .replace(/-/, "\n")
                      .replace(/-/g, " ")}
                  </span>
                </div>
                <div className="absolute bottom-[8%] left-10 right-10 z-10 flex gap-3">
                  {pokemon.types.map((type) => (
                    <span key={type} className={`type type--${type}`}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center w-full max-w-[600px] h-20 mx-auto my-5">
            {loading ? (
              <div className="loading-gif w-16 h-16" />
            ) : (
              showLoadMore && (
                <button
                  onClick={loadMore}
                  className="load-more-btn w-full h-[75px] text-[#b3eafe] cursor-pointer [text-shadow:0_0_5px_#b3eafe] hover:text-black transition-colors text-[19px]"
                >
                  ค้นหาเพิ่มเติม
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PokemonList;
