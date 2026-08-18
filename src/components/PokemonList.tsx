import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { API_Base } from "../config";
import { getPokemonId, BuildPokemon, type Tdata } from "../data/pokemonData";
import RandomPokemonBalls from "./Randompokemon";

// Search filter function: กรองข้อมูลโปเกมอนตามคำค้นหา (id, name, type) โดยไม่สนใจตัวพิมพ์ใหญ่/เล็ก
const filterInput = (list: Tdata[], keyword: string) => {
  const key = keyword.toLowerCase().trim(); // คำค้นหาแบบตัดช่องว่างและปรับเป็นพิมพ์เล็กแล้ว
  if (!key) return list;
  return list.filter(
    (pokemon) =>
      // พิมพ์เลข เพิ่ม 0 ข้างหน้า ให้ครบ 4 ตัว แล้วทำการเปรียบเทียบว่ามีเลขที่พิมพ์อยู่ใน id หรือไม่
      pokemon.id.padStart(4, "0").includes(key) ||
      // พิมพ์ชื่อ ปรับเป็นพิมพ์เล็ก แล้วเปรียบเทียบว่ามีชื่อที่พิมพ์อยู่ในชื่อโปเกมอนหรือไม่
      pokemon.name.toLowerCase().includes(key) ||
      // พิมพ์ type โดยใช้ some() โดยใช้ callback function เพื่อเช็คว่ามี type ไหนบ้างที่ตรงกับคำค้นหาหรือไม่ 
      // แล้วปรับเป็นพิมพ์เล็ก เสร็จแล้วใช้ includes() เพื่อเช็คว่ามีคำค้นหาที่พิมพ์อยู่ใน type หรือไม่  
      pokemon.types.some((type) => type.toLowerCase().includes(key)),
  );
};

// รวมข้อมูลเก่ากับข้อมูลใหม่ โดยไม่ให้ซ้ำกัน (เช็คจากชื่อโปเกมอน) และเรียงตาม id จากน้อยไปมาก
const mergeData = (prev: Tdata[], incoming: Tdata[]) => { // prev = ข้อมูลเก่าที่มีอยู่แล้ว, incoming = ข้อมูลใหม่ที่โหลดมา
  const map = new Map(prev.map((pokemon) => [pokemon.name, pokemon])); // สร้าง Map จากข้อมูลเก่า โดยใช้ชื่อโปเกมอนเป็น key และข้อมูลโปเกมอนเป็น value
  incoming.forEach( // วนลูปข้อมูลใหม่ 
    (pokemon) => !map.has(pokemon.name) && map.set(pokemon.name, pokemon),// ถ้า Map ยังไม่มีชื่อโปเกมอนนี้ ให้เพิ่มข้อมูลโปเกมอนนี้เข้าไปใน Map
  );
  return [...map.values()].sort((a, b) => +a.id - +b.id); // แปลง Map กลับเป็น array ของข้อมูลโปเกมอน แล้วเรียงตาม id จากน้อยไปมาก
};

// โหลดข้อมูลโปเกมอนชุดหนึ่งจาก API โดยใช้ offset เป็นตัวกำหนดหน้าที่จะโหลด (20 ตัวต่อหน้า)
const fetchBatch = async (offset: number) => {
  // ยิง fetch ไปที่ API เพื่อดึงรายชื่อ species 20 ตัวในหน้านี้ (แค่ name กับ url ยังไม่มีรายละเอียด)
  const list = await fetch(
    `${API_Base}/pokemon-species?limit=20&offset=${offset}`, // limit=20 คือจำนวน species ต่อหน้า, offset คือหน้าที่จะโหลดต่อจาก offset ตัวก่อนหน้า
  ).then((res) => res.json()); // แปลง response เป็น json เพื่อให้ได้ข้อมูล species list ที่มี name และ url ของ species ทั้ง 20 ตัว

  const allSpecies = await Promise.all( // Promise.all() คือการรอให้ fetch ของ species แต่ละตัวเสร็จทั้งหมด แล้ว return เป็น array ของ species แบบเต็ม
    list.results.map((species: { url: string }) => // list.results คือ array ของ species ทั้ง 20 ตัวในหน้านี้ โดยแต่ละตัวมี url ของ species นั้น ๆ
      fetch(species.url).then((res) => res.json()), // fetch ไปที่ url ของ species นั้น ๆ แล้วแปลง response เป็น json เพื่อให้ได้ข้อมูล species แบบเต็ม
    ),
  ); // เอา species ทั้งหมดมาเก็บใน allSpecies เป็น array ของ species แบบเต็ม 20 ตัว

  // entries ใช้สำหรับเก็บข้อมูลโปเกมอนที่เป็น default variety ของ species ทั้ง 20 ตัว โดยมี name, url, และ speciesUrl (url ของ species ที่โปเกมอนนี้เป็น default variety)
  // varieties เป็นร่างต่าง ๆ ของ species แต่ละตัว โดยแต่ละ variety มี pokemon (name, url) และ is_default (boolean) ว่าเป็น default variety หรือไม่
  const entries = allSpecies.flatMap((species, index) => // flatMap() คือการรวม array ของ array ให้เป็น array เดียว
    species.varieties // species.varieties คือ array ของ varieties ของ species นั้น ๆ โดยแต่ละ variety มี pokemon (name, url) และ is_default (boolean)
      .filter( // กรองเฉพาะ variety ที่เป็น default (is_default = true) เพื่อเอาโปเกมอนหลักของ species นั้น ๆ โดยมี name เป็น key และ url ของโปเกมอนนั้น ๆ
        (varieties: { pokemon: { name: string }; is_default: boolean }) => //
          BuildPokemon(varieties.pokemon.name, varieties.is_default) // BuildPokemon() คือฟังก์ชันที่สร้าง object ของโปเกมอนจาก name และ is_default โดย return เป็น object ที่มี id, name, types, sprite
      )
      .map((varieties: { pokemon: { name: string; url: string } }) => ({ // แล้ว map() เพื่อสร้าง object ของโปเกมอนที่มี name, url, และ speciesUrl (url ของ species ที่โปเกมอนนี้เป็น default variety) โดยใช้ index ของ species ใน allSpecies เพื่อเอา url ของ species มาเก็บไว้
        name: varieties.pokemon.name, // name ของโปเกมอนที่เป็น default variety ของ species นั้น ๆ
        url: varieties.pokemon.url, // url ของโปเกมอนที่เป็น default variety ของ species นั้น ๆ
        speciesUrl: list.results[index].url, // url ของ species ที่โปเกมอนนี้เป็น default variety (เอามาจาก list.results ของ species ทั้ง 20 ตัว)
        // index คือ แปลง species ทั้ง 20 ตัวใน list.results ให้เป็น index ของ species ใน allSpecies เพื่อเอา url ของ species มาเก็บไว้
      })),
  );

  // newData เป็นการยิง fetch ไปที่ url ของโปเกมอนแต่ละตัว เพื่อดึงข้อมูลโปเกมอนแบบเต็ม (มีรายละเอียดมากกว่าแค่ name และ url) แล้ว map() เพื่อสร้าง object ของโปเกมอนที่มี name, url, id, types, และ sprite
  const newData = await Promise.all( // Promise.all() คือการรอให้ fetch ของโปเกมอนแต่ละตัวเสร็จทั้งหมด แล้ว return เป็น array ของโปเกมอนแบบเต็ม
    entries.map((e: { name: string; url: string; speciesUrl: string }) => // ประกาศ e เป็น object ของโปเกมอนที่มี name, url, และ speciesUrl (url ของ species ที่โปเกมอนนี้เป็น default variety)
      fetch(e.url) // fetch ไปที่ url ของโปเกมอนนั้น ๆ เพื่อดึงข้อมูลโปเกมอนแบบเต็ม (มีรายละเอียดมากกว่าแค่ name และ url)
        .then((res) => res.json()) // แปลง response เป็น json เพื่อให้ได้ข้อมูลโปเกมอนแบบเต็ม
        .then((data) => ({ //แปลงข้อมูลโปเกมอนแบบเต็มเป็น object ของโปเกมอนที่มี name, url, id, types, และ sprite โดยใช้ getPokemonId() เพื่อดึง id ของโปเกมอนจาก speciesUrl และ map() เพื่อดึง types ของโปเกมอนจาก data.types
          name: e.name,
          url: e.url, // แสดงส่วน
          id: getPokemonId(e.speciesUrl),
          types: data.types.map((t: { type: { name: string } }) => t.type.name),
          sprite:
            data.sprites?.other?.["official-artwork"]?.front_default ?? "", // แสดงรูปโปเกมอนจาก official-artwork ถ้าไม่มีให้ใช้ "" แทน
        })),
    ),
  );

  return { newData, hasNext: !!list.next }; // ทำการ return newData (array ของโปเกมอนแบบเต็ม) และ hasNext (boolean ว่ายังมีหน้าถัดไปของ species หรือไม่)
};

function PokemonList() { 
  const nav = useNavigate(); // ใช้ navigate ของ react-router เพื่อเปลี่ยนหน้า
  const [searchParams] = useSearchParams(); // ใช้ searchParams ของ react-router เพื่อดึง query string จาก url //Params ใน url เช่น ?type=fire จะได้ searchParams.get("type") = "fire"
  const initialType = searchParams.get("type") ?? ""; // initialType คือค่าของ type ที่ดึงมาจาก query string ถ้าไม่มีให้เป็น "" (empty string)
  const [data, setData] = useState<Tdata[]>([]); // ข้อมูลโปเกมอนทั้งหมดที่โหลดมาจาก API
  const [inputText, setInputText] = useState(""); // กล่องข้อความที่ผู้ใช้พิมพ์ในช่องค้นหา (ยังไม่ยืนยัน)
  const [searchKeyword, setSearchKeyword] = useState(initialType); // คำค้นหาที่ยืนยันแล้ว (กด Enter หรือกดปุ่มค้นหา) จะใช้ filterInput() เพื่อกรองข้อมูลโปเกมอน
  const [visibleCount, setVisibleCount] = useState(16); // จำนวนโปเกมอนที่จะแสดงในหน้าจอ (infinite scroll แบบกดปุ่ม "ค้นหาเพิ่มเติม") แสดงเริ่มต้น 16 ตัว 4 แถว 4 คอลัมน์
  const [hasMore, setHasMore] = useState(true); // มีข้อมูลโปเกมอนใน API เพิ่มอีกหรือไม่ (ถ้า hasMore = false แสดงว่าถึงหน้าสุดท้ายแล้ว)
  const [loading, setLoading] = useState(false); // กำลังโหลดข้อมูลโปเกมอนจาก API หรือไม่ (ใช้แสดง loading spinner)
  const hasFetched = useRef(false); // ตรวจสอบว่ามีการ fetch ข้อมูลโปเกมอนชุดแรกแล้วหรือยัง (เพื่อไม่ให้ fetch ซ้ำตอน render ใหม่)
  const offsetRef = useRef(0); // เก็บ offset ของ species ที่โหลดล่าสุด (20 ตัวต่อหน้า) เพื่อใช้ในการ fetch ชุดถัดไป
  const isFetching = useRef(false); // ตรวจสอบว่ากำลัง fetch ข้อมูลโปเกมอนอยู่หรือไม่ (เพื่อกันการยิงซ้อน)
  const dataRef = useRef<Tdata[]>([]); // เก็บข้อมูลโปเกมอนทั้งหมดที่โหลดมาจาก API (ใช้ ref เพราะ state จะ re-render ทุกครั้งที่เปลี่ยนค่า แต่ ref จะไม่ re-render)

  // filteredData คือข้อมูลโปเกมอนที่ถูกกรองตามคำค้นหา searchKeyword โดยใช้ useMemo() เพื่อให้คำนวณใหม่เฉพาะเมื่อ data หรือ searchKeyword เปลี่ยนแปลง
  const filteredData = useMemo(
    () => filterInput(data, searchKeyword), 
    [data, searchKeyword], // เรียก data และ searchKeyword เพื่อให้คำนวณใหม่เฉพาะเมื่อ data หรือ searchKeyword เปลี่ยนแปลง
  );
  
  // visibleData คือข้อมูลโปเกมอนที่จะแสดงในหน้าจอ (จำนวนตาม visibleCount) โดยใช้ useMemo() เพื่อให้คำนวณใหม่เฉพาะเมื่อ filteredData หรือ visibleCount เปลี่ยนแปลง
  const visibleData = useMemo(
    () => filteredData.slice(0, visibleCount), // .slice() คือการตัด array filteredData ให้เหลือแค่ index 0 ถึง visibleCount-1 (จำนวนโปเกมอนที่จะแสดงในหน้าจอ)
    [filteredData, visibleCount], // เรียก filteredData และ visibleCount เพื่อให้คำนวณใหม่เฉพาะเมื่อ filteredData หรือ visibleCount เปลี่ยนแปลง
  );
  
  // กรองว่ามีข้อมูลโปเกมอนที่ถูกกรองแล้วมากกว่า visibleCount หรือไม่ (เพื่อใช้ในการแสดงปุ่ม "ค้นหาเพิ่มเติม") โดยใช้ hasMoreCached เป็น boolean
  const hasMoreCached = visibleCount < filteredData.length; 
  // notFound คือกรณีที่ผู้ใช้ค้นหาแล้วไม่เจอโปเกมอนเลย (โหลดข้อมูลเสร็จแล้ว มีคำค้นหา แต่ filteredData ว่างเปล่า) เพื่อใช้แสดงข้อความแจ้งผู้ใช้
  const notFound = !loading && !!searchKeyword && filteredData.length === 0;
  // โชว์ปุ่ม "ค้นหาเพิ่มเติม" ก็ต่อเมื่อไม่กำลังโหลดข้อมูล ไม่ใช่กรณีหาไม่เจอ และมีข้อมูลโปเกมอนที่ถูกกรองแล้วมากกว่า visibleCount หรือยังมีข้อมูลโปเกมอนใน API เพิ่มอีก
  const showLoadMore = !loading && !notFound && (hasMoreCached || hasMore);

  // ฟังก์ชัน withFetch() ใช้สำหรับห่อหุ้มการเรียก API เพื่อป้องกันการเรียกซ้อนกัน และจัดการ state loading ให้ถูกต้อง
  const withFetch = async (fn: () => Promise<void>) => { // fn คือฟังก์ชันที่ส่งเข้ามาเพื่อเรียก API promise<void> คือฟังก์ชันที่ return เป็น Promise ที่ไม่มีค่า return (void)
    if (isFetching.current) return; // ถ้ากำลัง fetch อยู่แล้ว ให้ return ออกไปเลย (ไม่ต้องทำอะไร)
    isFetching.current = true; // ตั้ง isFetching เป็น true เพื่อบอกว่ากำลัง fetch อยู่
    setLoading(true); // ตั้ง loading เป็น true เพื่อบอกว่ากำลังโหลดข้อมูลโปเกมอน
    try { // ลองเรียก fn() เพื่อ fetch ข้อมูลโปเกมอน
      await fn();
    } catch (e) { // ถ้ามี error เกิดขึ้น ให้ log error ออกมาใน console
      console.error(e);
    } finally { // ไม่ว่าจะสำเร็จหรือไม่ ให้ตั้ง loading เป็น false และ isFetching เป็น false เพื่อบอกว่าหยุด fetch แล้ว
      setLoading(false);
      isFetching.current = false;
    }
  };

  // ฟังก์ชัน applyBatch() ใช้สำหรับ merge ข้อมูลโปเกมอนใหม่เข้ากับข้อมูลโปเกมอนเก่า และอัปเดต state data และ hasMore ให้ถูกต้อง
  const applyBatch = (merged: Tdata[], hasNext: boolean) => { // merged มี type Tdata[] คือ array ของโปเกมอนที่ merge แล้ว, hasNext มี type boolean คือว่ามีหน้าถัดไปของ species หรือไม่
    if (!hasNext) setHasMore(false); // ถ้าไม่มีหน้าถัดไปของ species ให้ตั้ง hasMore เป็น false เพื่อบอกว่าไม่มีข้อมูลโปเกมอนใน API เพิ่มอีก
    dataRef.current = merged; // dataRef.current คือ ref ของข้อมูลโปเกมอนทั้งหมดที่โหลดมาจาก API ให้เก็บ merged เข้าไป
    setData([...merged]); // setData() คือ state ของข้อมูลโปเกมอนทั้งหมดที่โหลดมาจาก API ให้ update เป็น merged (ใช้ spread operator เพื่อสร้าง array ใหม่) เพื่อให้ component re-render และแสดงข้อมูลโปเกมอนใหม่
  };

  // ฟังก์ชัน fetchSpecies() ใช้สำหรับโหลดข้อมูลโปเกมอนชุดหนึ่งจาก API โดยใช้ offset เป็นตัวกำหนดหน้าที่จะโหลด (20 ตัวต่อหน้า) และ merge ข้อมูลโปเกมอนใหม่เข้ากับข้อมูลโปเกมอนเก่า
  const fetchSpecies = (offset: number) => // offset คือหน้าที่จะโหลดต่อจาก offset ตัวก่อนหน้า (20 ตัวต่อหน้า)
    withFetch(async () => { // ห่อหุ้มการเรียก API ด้วย withFetch() เพื่อป้องกันการเรียกซ้อนกัน และจัดการ state loading ให้ถูกต้อง
      const { newData, hasNext } = await fetchBatch(offset); // ประกาศ newData และ hasNext โดยเรียก fetchBatch() เพื่อโหลดข้อมูลโปเกมอนชุดหนึ่งจาก API โดยใช้ offset เป็นตัวกำหนดหน้าที่จะโหลด (20 ตัวต่อหน้า)
      offsetRef.current = offset; // เก็บ offset ปัจจุบันไว้ใน offsetRef.current เพื่อใช้ในการ fetch ชุดถัดไป
      applyBatch(mergeData(dataRef.current, newData), hasNext); // merge ข้อมูลโปเกมอนเก่ากับข้อมูลโปเกมอนใหม่ แล้วอัปเดต state data และ hasMore ให้ถูกต้อง
    });

  // ฟังก์ชัน fetchUntilEnough() ใช้สำหรับโหลดข้อมูลโปเกมอนจนกว่าจะมีข้อมูลโปเกมอนที่ถูกกรองแล้วมากกว่า needed (จำนวนที่ต้องการแสดง) โดยใช้คำค้นหา keyword
  const fetchUntilEnough = (keyword: string, needed: number) =>
    withFetch(async () => { // ห่อหุ้มการเรียก API ด้วย withFetch() เพื่อป้องกันการเรียกซ้อนกัน และจัดการ state loading ให้ถูกต้อง
      let cur = [...dataRef.current]; // cur คือข้อมูลโปเกมอนทั้งหมดที่โหลดมาจาก API (ใช้ spread operator เพื่อสร้าง array ใหม่) เพื่อใช้ในการกรองข้อมูลโปเกมอนตามคำค้นหา keyword
      while (filterInput(cur, keyword).length < needed) { // ถ้าจำนวนโปเกมอนที่ถูกกรองแล้วตามคำค้นหา keyword น้อยกว่า needed (จำนวนที่ต้องการแสดง) ให้โหลดข้อมูลโปเกมอนชุดถัดไปจาก API
        const next = offsetRef.current + 20; // next คือ offset ของ species ที่จะโหลดชุดถัดไป (20 ตัวต่อหน้า) โดยเอา offset ปัจจุบัน + 20
        const { newData, hasNext } = await fetchBatch(next); // ประกาศ newData และ hasNext โดยเรียก fetchBatch() เพื่อโหลดข้อมูลโปเกมอนชุดถัดไปจาก API โดยใช้ next เป็นตัวกำหนดหน้าที่จะโหลด (20 ตัวต่อหน้า)
        offsetRef.current = next; // เก็บ offset ปัจจุบันไว้ใน offsetRef.current เพื่อใช้ในการ fetch ชุดถัดไป
        cur = mergeData(cur, newData); // merge ข้อมูลโปเกมอนเก่ากับข้อมูลโปเกมอนใหม่ แล้วเก็บไว้ใน cur เพื่อใช้ในการกรองข้อมูลโปเกมอนตามคำค้นหา keyword
        applyBatch(cur, hasNext); // merge ข้อมูลโปเกมอนเก่ากับข้อมูลโปเกมอนใหม่ แล้วอัปเดต state data และ hasMore ให้ถูกต้อง
        if (!hasNext) break; // ถ้าไม่มีหน้าถัดไปของ species ให้ break ออกจาก while loop เพื่อหยุดโหลดข้อมูลโปเกมอนชุดถัดไป
      }
    });

  // ฟังก์ชัน handleSearch() ใช้สำหรับจัดการเมื่อผู้ใช้กดปุ่มค้นหา หรือกด Enter ในช่องค้นหา โดยจะอัปเดต searchKeyword และ visibleCount ให้ถูกต้อง และถ้าจำนวนโปเกมอนที่ถูกกรองแล้วตามคำค้นหา keyword น้อยกว่า 16 ให้โหลดข้อมูลโปเกมอนจนกว่าจะมีข้อมูลเพียงพอ
  const handleSearch = () => {
    const keyword = inputText.trim();
    if (keyword === searchKeyword) return;
    setSearchKeyword(keyword);
    setVisibleCount(16);
    if (keyword && filterInput(dataRef.current, keyword).length < 16)
      fetchUntilEnough(keyword, 16);
  };

  // ฟังก์ชัน loadMore() ใช้สำหรับโหลดข้อมูลโปเกมอนเพิ่มเติมเมื่อผู้ใช้กดปุ่ม "ค้นหาเพิ่มเติม" โดยจะอัปเดต visibleCount ให้ถูกต้อง และโหลดข้อมูลจาก API หากจำเป็น
  const loadMore = () => {
    if (loading || isFetching.current) return; // ถ้ากำลังโหลดข้อมูลโปเกมอนอยู่ หรือกำลัง fetch ข้อมูลโปเกมอนอยู่ ให้ return ออกไปเลย (ไม่ต้องทำอะไร)
    const next = visibleCount + 16; // next คือจำนวนโปเกมอนที่จะแสดงในหน้าจอถัดไป (เพิ่มอีก 16 ตัว)
    if (searchKeyword) { // ถ้ามีคำค้นหา searchKeyword ให้กรองข้อมูลโปเกมอนตามคำค้นหา และเช็คว่ามีข้อมูลเพียงพอหรือไม่
      if (filteredData.length >= next || !hasMore) setVisibleCount(next);
      else // ถ้าไม่มีข้อมูลเพียงพอ ให้โหลดข้อมูลโปเกมอนจนกว่าจะมีข้อมูลเพียงพอ searchKeyword และ next (จำนวนโปเกมอนที่จะแสดงในหน้าจอถัดไป) โดยใช้ fetchUntilEnough() เพื่อโหลดข้อมูลโปเกมอนจนกว่าจะมีข้อมูลเพียงพอ
        fetchUntilEnough(searchKeyword, next).then(() => setVisibleCount(next)); // 
    } else { 
      if (hasMoreCached) setVisibleCount(next); // ถ้า hasMoreCached ได้ ให้เพิ่ม visibleCount เป็น next (จำนวนโปเกมอนที่จะแสดงในหน้าจอถัดไป)
      else if (hasMore)
        fetchSpecies(offsetRef.current + 20).then(() => setVisibleCount(next)); // ถ้า hasMore ได้ ให้โหลดข้อมูลโปเกมอนชุดถัดไปจาก API โดยใช้ fetchSpecies() เพื่อโหลดข้อมูลโปเกมอนชุดถัดไป และอัปเดต visibleCount เป็น next (จำนวนโปเกมอนที่จะแสดงในหน้าจอถัดไป)
    }
  };

  // useEffect() ถ้าเป็นการ render ครั้งแรก ให้โหลดข้อมูลโปเกมอนชุดแรกจาก API และถ้ามี initialType ให้โหลดข้อมูลโปเกมอนจนกว่าจะมีข้อมูลเพียงพอ (16 ตัว) โดยใช้ fetchSpecies() และ fetchUntilEnough()
  useEffect(() => {
    if (hasFetched.current) return; // hasFetched.current คือ ref ที่ใช้ตรวจสอบว่ามีการ fetch ข้อมูลโปเกมอนชุดแรกแล้วหรือยัง ถ้ามีแล้วให้ return ออกไปเลย (ไม่ต้องทำอะไร)
    hasFetched.current = true;
    fetchSpecies(0).then(() => { // fetchSpecies(0) คือการโหลดข้อมูลโปเกมอนชุดแรกจาก API โดยใช้ offset = 0 (20 ตัวแรก)
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
