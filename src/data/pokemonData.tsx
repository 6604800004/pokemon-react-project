// ข้อมูลโปเกมอน 1 ตัวที่ใช้แสดงในหน้ารายการ
export type Tdata = {
    name: string;
    url: string;
    id: string;
    types: string[];
    sprite: string;
};

// กรองว่าร่าง/ฟอร์มไหนควรแสดงในแอป: ตัดร่าง totem, cap และ raichu-mega ทิ้ง
// ที่เหลือแสดงเฉพาะร่างหลัก (isDefault) หรือร่างพิเศษที่รองรับ (mega, galar, gmax, alola)
export const BuildPokemon = (name: string, isDefault: boolean) =>
  !name.includes("-totem") &&
  !name.includes("-cap") &&
  !name.includes("raichu-mega") &&
  (isDefault ||
    name.includes("-mega") ||
    name.includes("-mega-x") ||
    name.includes("-mega-y") ||
    name.includes("-galar") ||
    name.includes("-gmax") ||
    name.includes("-alola"));

// โครงสร้าง types ของโปเกมอนตามที่ PokeAPI ส่งมา
export type TypePokemon = {
    types: {
        slot: number,
        type: {
            name: string,
            url: string
        }
    }[];
}

// ข้อมูลรายละเอียดโปเกมอน 1 ตัว (จาก endpoint /pokemon/:id)
export type PokemonDetailData = {
    id: number;
    name: string;
    height: number;
    weight: number;
    sprites: {
        front_default: string;
        other: {
            "official-artwork": {
                front_default: string;
            };
        };
    };
    types: TypePokemon["types"];
    stats: {
        base_stat: number;
        stat: {
            name: string;
        };
    }[];
    abilities: {
        slot: number;
        is_hidden: boolean;
        ability: {
            name: string;
            url: string;
        };
    }[];
    species: {
        url: string;
    };
    
};

// ความสัมพันธ์ความเสียหายของแต่ละ type ใช้คำนวณจุดอ่อน/จุดต้าน
export type TypeDamageRelations = {
    damage_relations: {
        double_damage_from: { name: string; url: string }[];
        half_damage_from: { name: string; url: string }[];
        no_damage_from: { name: string; url: string }[];
    };
};

// ดึง id ออกจาก url ของ PokeAPI โดยเอาส่วนสุดท้ายหลัง "/"
export const getPokemonId = (url: string) => {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
}

// ร่าง/ฟอร์มของโปเกมอนตัวหนึ่ง (จาก species.varieties)
export type Variety = {
  is_default: boolean;
  pokemon: { name: string; url: string };
};

// props ของ StatBar: ค่าพลัง และชื่อค่าพลังที่จะแสดง
export type StatBarProps = {
  value: number;
  name : string;
};

// แปลชื่อค่าพลัง (stat) จากภาษาอังกฤษเป็นภาษาไทยเพื่อแสดงผล
export const Status_Label: Record<string, string> = {
  hp: "HP",
  attack: "โจมตี",
  defense: "ป้องกัน",
  "special-attack": "โจมตีพิเศษ",
  "special-defense": "ป้องกันพิเศษ",
  speed: "ความเร็ว",
};
