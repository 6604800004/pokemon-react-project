export type Tdata = {
    name: string;
    url: string;
    id: string;
    types: string[];
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

// เพิ่มใหม่: type สำหรับหน้า PokemonDetail
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