export type Tdata = {
    name: string;
    url: string;
    id: string;
    types: string[];
    sprite: string; 
};

export type TypePokemon = {
    types: {
        slot: number,
        type: {
            name: string,
            url: string
        }
    }[];
}

export const BuildPokemon = (name: string, isDefault: boolean) =>
  !name.includes("-totem") &&
  !name.includes("-cap") &&
  (isDefault ||
    name.includes("-mega") ||
    name.includes("-mega-x") ||
    name.includes("-mega-y") ||
    name.includes("-galar") ||
    name.includes("-gmax") ||
    name.includes("-alola"));

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

export type TypeDamageRelations = {
    damage_relations: {
        double_damage_from: { name: string; url: string }[];
        half_damage_from: { name: string; url: string }[];
        no_damage_from: { name: string; url: string }[];
    };
};

export const getPokemonId = (url: string) => {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
}

export type StatBarProps = {
  label: string;
  value: number;
};

export type Variety = {
  is_default: boolean;
  pokemon: { name: string; url: string };
};

export const Status_Label: Record<string, string> = {
  hp: "HP",
  attack: "โจมตี",
  defense: "ป้องกัน",
  "special-attack": "โจมตีพิเศษ",
  "special-defense": "ป้องกันพิเศษ",
  speed: "ความเร็ว",
};