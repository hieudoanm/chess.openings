import json
from typing import TypedDict


class Opening(TypedDict):
    eco: str
    name: str
    pgn: str


openings: list[Opening] = []
with open("openings/all.json", "r", encoding="utf-8") as openings_file:
    openings = json.load(openings_file)

list_of_moves = [
    [value for index, value in enumerate(o.get("pgn", "").split(" ")) if index % 3 != 0]
    for o in openings
]


list_of_moves.sort()


def build_tree(data):
    tree = {}
    for path in data:
        current = tree
        for key in path:
            current = current.setdefault(key, {})  # Move deeper in the tree
    return tree


tree = build_tree(list_of_moves)


with open("./openings/tree.json", "w", encoding="utf-8") as tree_json_file:
    json.dump(tree, tree_json_file, ensure_ascii=False, indent=2)
