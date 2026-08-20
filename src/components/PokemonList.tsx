import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { API_Base } from "../config";
import { getPokemonId, BuildPokemon, type Tdata } from "../data/pokemonData";
import RandomPokemonBalls from "./Randompokemon";
const filterInput = (list: Tdata[], keyword: string) => {
  const key = keyword.toLowerCase().trim();
  if (!key) return list;
  return list.filter(
    (pokemon) =>
      // เติม 0 ให้ครบ 4 หลักก่อนเทียบ เพื่อให้พิมพ์ "6" หรือ "0006" ก็เจอเหมือนกัน
      pokemon.id.padStart(4, "0").includes(key) ||
      pokemon.name.toLowerCase().includes(key) ||
      pokemon.types.some((type) => type.toLowerCase().includes(key)),
  );
};

// รวมข้อมูลเก่ากับใหม่ ตัดตัวซ้ำด้วยชื่อ แล้วเรียงตาม id
const mergeData = (prev: Tdata[], incoming: Tdata[]) => {
  const map = new Map(prev.map((pokemon) => [pokemon.name, pokemon]));
  incoming.forEach(
    (pokemon) => !map.has(pokemon.name) && map.set(pokemon.name, pokemon),
  );
  return [...map.values()].sort((a, b) => +a.id - +b.id);
};

// โหลด species 20 ตัวต่อหน้า แล้วขยายเป็นข้อมูลโปเกมอนที่พร้อมแสดงผล
const fetchBatch = async (offset: number) => {
  // รอบแรกได้แค่ name กับ url ของ species ยังไม่มีรายละเอียด
  const list = await fetch(
    `${API_Base}/pokemon-species?limit=20&offset=${offset}`,
  ).then((res) => res.json());

  // ยิงขอรายละเอียดพร้อมกันทั้ง 20 ตัว (Promise.all คืนค่าตามลำดับเดิม จึงใช้ index อ้างกลับได้)
  const allSpecies = await Promise.all(
    list.results.map((species: { url: string }) =>
      fetch(species.url).then((res) => res.json()),
    ),
  );

  // 1 species มีได้หลายร่าง (mega / gmax / alola) จึงใflatMap ยุบให้เหลือชั้นเดียว
  const entries = allSpecies.flatMap((species, index) =>
    species.varieties
      .filter((v: { pokemon: { name: string }; is_default: boolean }) =>
        BuildPokemon(v.pokemon.name, v.is_default),
      )
      .map((v: { pokemon: { name: string; url: string } }) => ({
        name: v.pokemon.name,
        url: v.pokemon.url,
        // เก็บ url ของ species ไว้ด้วย เพราะเลข dex ต้องเอามาจากตรงนี้ ไม่ใช่จาก url ของร่าง
        speciesUrl: list.results[index].url,
      })),
  );

  const newData = await Promise.all(
    entries.map((e: { name: string; url: string; speciesUrl: string }) =>
      fetch(e.url)
        .then((res) => res.json())
        .then((data) => ({
          name: e.name,
          url: e.url,
          // ใช้ speciesUrl เพื่อให้ทุกร่างของสายพันธุ์เดียวกันได้เลข dex เท่ากัน
          id: getPokemonId(e.speciesUrl),
          types: data.types.map((t: { type: { name: string } }) => t.type.name),
          sprite:
            data.sprites?.other?.["official-artwork"]?.front_default ?? "",
        })),
    ),
  );
  return { newData, hasNext: !!list.next };
};

function PokemonList() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") ?? ""; // มาจาก url เช่น /PokeDex?type=fire
  const [data, setData] = useState<Tdata[]>([]);
  const [inputText, setInputText] = useState(""); // ข้อความในช่องค้นหา (ยังไม่กดค้นหา)
  const [searchKeyword, setSearchKeyword] = useState(initialType); // คำค้นหาที่ยืนยันแล้ว
  const [visibleCount, setVisibleCount] = useState(16); // แสดงทีละ 16 ตัว (4 แถว 4 คอลัมน์)
  const [hasMore, setHasMore] = useState(true); // ยังมีหน้าถัดไปใน API หรือไม่
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false); // กัน useEffect ยิงซ้ำตอน StrictMode render 2 รอบ
  const offsetRef = useRef(0);
  const isFetching = useRef(false); // กันยิง API ซ้อนกัน
  const dataRef = useRef<Tdata[]>([]); // อ่านค่าล่าสุดได้ทันที ไม่ต้องรอ state อัปเดต

  const filteredData = useMemo(
    () => filterInput(data, searchKeyword),
    [data, searchKeyword],
  );

  const visibleData = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount],
  );

  const hasMoreCached = visibleCount < filteredData.length; // โหลดไว้แล้วแต่ยังไม่ได้แสดง
  const notFound = !loading && !!searchKeyword && filteredData.length === 0;
  const showLoadMore = !loading && !notFound && (hasMoreCached || hasMore);

  // ครอบการเรียก API ทุกครั้ง เพื่อกันยิงซ้อนและคุม state loading ไว้ที่เดียว
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

  const applyBatch = (merged: Tdata[], hasNext: boolean) => {
    if (!hasNext) setHasMore(false);
    dataRef.current = merged;
    setData([...merged]);
  };

  const fetchSpecies = (offset: number) =>
    withFetch(async () => {
      const { newData, hasNext } = await fetchBatch(offset);
      offsetRef.current = offset;
      applyBatch(mergeData(dataRef.current, newData), hasNext);
    });

  // ค้นหาแล้วเจอไม่พอ ให้โหลดหน้าถัดไปไปเรื่อย ๆ จนครบตามต้องการหรือหมด API
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

  const handleSearch = () => {
    const keyword = inputText.trim();
    if (keyword === searchKeyword) return;
    setSearchKeyword(keyword);
    setVisibleCount(16);
    if (keyword && filterInput(dataRef.current, keyword).length < 16)
      fetchUntilEnough(keyword, 16);
  };

  const loadMore = () => {
    if (loading || isFetching.current) return;
    const next = visibleCount + 16;
    if (searchKeyword) {
      // ที่โหลดไว้ยังไม่พอ ต้องดึงเพิ่มก่อนค่อยเพิ่มจำนวนที่แสดง
      if (filteredData.length >= next || !hasMore) setVisibleCount(next);
      else
        fetchUntilEnough(searchKeyword, next).then(() => setVisibleCount(next));
    } else {
      if (hasMoreCached) setVisibleCount(next);
      else if (hasMore)
        fetchSpecies(offsetRef.current + 20).then(() => setVisibleCount(next));
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSpecies(0).then(() => {
      // เข้ามาพร้อม ?type=... ต้องโหลดต่อจนกรองได้ครบ 16 ตัว
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

          {/* ถ้าค้นหาแล้วไม่เจอโปเกมอนเลย (ไม่มีข้อมูลตรงกับคำค้นหา) ให้แสดงกล่องข้อความแจ้งผู้ใช้แทนรายการโปเกมอน */}
          {notFound && (
            <div className="max-w-[800px] mx-auto my-10 rounded-2xl border-2 border-[#466e9b] bg-[#0a141e] px-8 py-10 text-center">
              <p className="text-white text-[22px] font-bold">
                หาโปเกมอนไม่เจอเลย
              </p>
              <p className="text-white text-[16px] mt-3">
                ลองค้นหาด้วยเงื่อนไขอื่นดูกันเถอะ
              </p>
            </div>
          )}

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
