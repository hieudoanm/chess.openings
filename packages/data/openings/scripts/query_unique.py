import json
import pandas
from typing import TypedDict
import chess.pgn
import io


class Opening(TypedDict):
    eco: str
    name: str
    pgn: str


openings: list[Opening] = []
with open("openings/all.json", "r", encoding="utf-8") as openings_file:
    openings = json.load(openings_file)


def contains(strings: list[str], substring) -> bool:
    for string in strings:
        if string != substring and substring in string:
            return False
    return True


all_pgn: list[str] = [opening.get("pgn", "") for opening in openings]


unique_openings = list(
    filter(lambda opening: contains(all_pgn, opening.get("pgn", "")), openings)
)


def get_value_or_empty(lst, index):
    """Returns the value at the given index in lst or an empty string if out of bounds."""
    return lst[index] if 0 <= index < len(lst) else ""


def get_moves(pgn: str) -> list[str]:
    items: list[str] = pgn.split(" ")
    moves: list[str] = [item for index, item in enumerate(items) if index % 3 != 0]
    return moves


def get_half_moves(pgn: str) -> int:
    moves: list[str] = get_moves(pgn)
    return len(moves)


def get_fen(pgn: str) -> str:
    pgn_string = io.StringIO(pgn)
    game = chess.pgn.read_game(pgn_string)
    board = game.board()
    for move in game.mainline_moves():
        board.push(move)
    return board.fen()


unique_openings_dataframe = pandas.DataFrame(unique_openings)
unique_openings_dataframe["first"] = unique_openings_dataframe["pgn"].apply(
    lambda pgn: f"{get_value_or_empty(pgn.split(' '), 1)}-{get_value_or_empty(pgn.split(' '), 2)}"
)
unique_openings_dataframe["half_moves"] = unique_openings_dataframe["pgn"].apply(
    lambda pgn: get_half_moves(pgn)
)
unique_openings_dataframe = unique_openings_dataframe.sort_values(
    by=["group", "subgroup", "name", "first", "pgn"],
    ascending=[True, True, True, True, True],
    kind="stable",
)
unique_openings_dataframe["fen"] = unique_openings_dataframe["pgn"].apply(
    lambda pgn: get_fen(pgn)
)


sorted_unique_openings = unique_openings_dataframe.to_dict(orient="records")


with open(
    "./openings/unique.json", "w", encoding="utf-8"
) as sorted_unique_openings_json_file:
    json.dump(
        sorted_unique_openings,
        sorted_unique_openings_json_file,
        ensure_ascii=False,
        indent=2,
    )
