import json
import pandas
from typing import TypedDict


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


unique_openings_dataframe = pandas.DataFrame(unique_openings)
unique_openings_dataframe = unique_openings_dataframe.sort_values(
    by=["group", "subgroup", "pgn"], ascending=[True, True, True], kind="stable"
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
