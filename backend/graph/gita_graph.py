"""
graphGita — NetworkX in-memory knowledge graph.

Node types:  MentalState  ──triggers_remedy──▶  Concept  ──taught_in──▶  Verse
"""

from __future__ import annotations

from typing import Tuple

import networkx as nx

from backend.models.states import MentalState
from backend.models.verses import GITA_VERSES


def build_knowledge_graph() -> nx.DiGraph:
    """Construct the directed graph with all four remedy paths."""
    G = nx.DiGraph()

    mapping = {
        MentalState.ANXIETY:     ("Nishkama Karma",              "Ch2:V47"),
        MentalState.DEPRESSION:  ("Atma-Shatru / Atma-Uddhara",  "Ch6:V5"),
        MentalState.STRESS:      ("Dhyana & Indriya-Nigraha",    "Ch2:V63"),
        MentalState.EQUILIBRIUM: ("Sthitaprajna",                "Ch2:V56"),
    }

    for state, (concept, vid) in mapping.items():
        vd = GITA_VERSES[state]
        G.add_node(state.value,  type="mental_state")
        G.add_node(concept,      type="gita_concept",
                   sanskrit=vd.concept_sanskrit)
        G.add_node(vid,          type="verse",
                   chapter=vd.chapter, verse=vd.verse)
        G.add_edge(state.value, concept, relation="triggers_remedy")
        G.add_edge(concept,     vid,     relation="taught_in")

    return G


def query_graph_path(
    G: nx.DiGraph,
    state: MentalState,
) -> Tuple[str, str]:
    """Traverse graph to find *(concept_name, verse_id)* for a state."""
    concept, verse = "—", "—"
    for succ in G.successors(state.value):
        if G.nodes[succ].get("type") == "gita_concept":
            concept = succ
            for succ2 in G.successors(concept):
                if G.nodes[succ2].get("type") == "verse":
                    verse = succ2
            break
    return concept, verse
