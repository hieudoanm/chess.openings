import io
from typing import TypedDict
import json
import pandas
from stockfish import Stockfish
from re import sub
from chess_gif.gif_maker import GIFMaker
import pathlib


stockfish = Stockfish()


class Opening(TypedDict):
    eco: str
    name: str
    pgn: str


unique_openings: list[Opening] = []
with open("openings/unique.json", "r", encoding="utf-8") as unique_openings_file:
    unique_openings = json.load(unique_openings_file)


def get_moves(pgn: str) -> list[str]:
    items: list[str] = pgn.split(" ")
    moves: list[str] = [item for index, item in enumerate(items) if index % 3 != 0]
    return moves


def get_main_line_score(pgn: str, pgn_list: list[str]) -> int:
    moves_list: list[list[str]] = [get_moves(pgn_item) for pgn_item in pgn_list]
    moves: list[str] = get_moves(pgn)
    index: int = 1
    flag = True
    while flag:
        moves_string: str = "-".join(moves[0:index])
        moves_contained: list[str] = [
            "-".join(moves_item)
            for moves_item in moves_list
            if "-".join(moves_item).startswith(moves_string)
        ]
        if len(moves_contained) <= 1 or len(moves) == index:
            flag = False
        else:
            index += 1
    print(pgn, index)
    return index


def get_evaluation(fen: str) -> float:
    stockfish.set_fen_position(fen)
    evaluation: dict = stockfish.get_evaluation()
    centipawn: int = evaluation.get("value", 0)
    pawn: float = centipawn / 100
    print(fen, pawn)
    return pawn


def get_value_or_empty(lst, index):
    """Returns the value at the given index in lst or an empty string if out of bounds."""
    return lst[index] if 0 <= index < len(lst) else ""


unique_openings_data_frame = pandas.DataFrame(unique_openings)
pgn_list: list[str] = unique_openings_data_frame["pgn"].tolist()
unique_openings_data_frame["evaluation"] = unique_openings_data_frame["fen"].apply(
    lambda fen: get_evaluation(fen)
)
unique_openings_data_frame["advantage"] = unique_openings_data_frame[
    "evaluation"
].apply(lambda evaluation: "white" if evaluation > 0 else "black")
unique_openings_data_frame["main_line_score"] = unique_openings_data_frame["pgn"].apply(
    lambda pgn: get_main_line_score(pgn, pgn_list)
)
unique_openings_data_frame: pandas.DataFrame = unique_openings_data_frame.sort_values(
    by=["group", "subgroup", "name", "first", "pgn", "main_line_score"]
)
unique_openings_data_frame.to_csv("./openings/unique.csv", index=False)


unique_openings_group_counts: pandas.Series[int] = unique_openings_data_frame[
    ["first", "name"]
].value_counts()
print(unique_openings_group_counts)


def snake_case(s) -> str:
    return "_".join(
        sub(
            "([A-Z][a-z]+)", r" \1", sub("([A-Z]+)", r" \1", s.replace("-", " "))
        ).split()
    ).lower()


for index in unique_openings_data_frame.index:
    pgn: str = unique_openings_data_frame["pgn"][index]
    first: str = unique_openings_data_frame["first"][index]
    opening: str = unique_openings_data_frame["name"][index]
    half_moves: int = unique_openings_data_frame["half_moves"][index]
    main_line_score: int = unique_openings_data_frame["main_line_score"][index]
    opening_folder: str = (
        snake_case(opening).replace(":", "").replace(",", "").replace("'", "_")
    )
    name: str = unique_openings_data_frame["name"][index]
    file_name: str = (
        snake_case(name).replace(":", "").replace(",", "").replace("'", "_")
    )
    gif_maker = GIFMaker(delay=500, h_margin=0, v_margin=0)
    pgn_bytes: bytes = str.encode(pgn)
    pgn_folder: str = f"./openings/pgn/{first}/{opening_folder}"
    pathlib.Path(pgn_folder).mkdir(parents=True, exist_ok=True)
    pgn_file: io.TextIOWrapper[io._WrappedBuffer] = open(
        f"{pgn_folder}/{main_line_score}_{file_name}_{half_moves}.pgn", "w"
    )
    print(f"{first}/{file_name}", pgn)
    pgn_file.write(pgn)
    pgn_file.close()
    gif_folder: str = f"./openings/gif/{first}/{opening_folder}"
    pathlib.Path(gif_folder).mkdir(parents=True, exist_ok=True)
    gif_maker.make_gif_from_pgn_file(
        f"{pgn_folder}/{main_line_score}_{file_name}_{half_moves}.pgn",
        f"{gif_folder}/{main_line_score}_{file_name}_{half_moves}.gif",
    )
