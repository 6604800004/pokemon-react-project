import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router';
import { type Tdata } from "../data/pokemonData";
import "../css/App-Detail.css"

function PokemonDetail() {
    const nav = useNavigate();
    const [data, setData] = useState<Tdata | null>(null);
    const { id } = useParams();

    useEffect(() => {
        if (!id) {
            nav("/404", { replace: true });
            return;
        }
        let cancelled = false;
        const fetchData = async () => {
            try {
                const numericId = parseInt(id, 10);
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon-form/${numericId}`);
                if (!res.ok) {
                    if (!cancelled) nav("/404", { replace: true });
                    return;
                }
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch (err) {
                if (!cancelled) nav("/404", { replace: true });
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [id, nav]);

    return (
        <>
            <div className="header">
                <div className="logo__" />
            </div>

            <div className="pokemon-detail-contents">
                <div className="pokedex-detail__header">
                    <a className="pokemon-detail__header__back-to-top" onClick={() => nav(-1)}>
                        โปเกเด็กซ์
                    </a>
                </div>
            </div>
        </>
    );
}

export default PokemonDetail;