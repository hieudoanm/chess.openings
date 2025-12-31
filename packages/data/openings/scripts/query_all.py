import io
import json
import pandas
import requests
from typing import TypedDict


letters: list[str] = ["a", "b", "c", "d", "e"]
url = "https://raw.githubusercontent.com/lichess-org/chess-openings/master"

openings_data_frame = pandas.DataFrame()

for letter in letters:
    print("letter", letter)
    letter_url: str = f"{url}/{letter}.tsv"
    response: requests.Response = requests.get(letter_url)
    tsv: str = response.text
    df: pandas.DataFrame = pandas.read_csv(io.StringIO(tsv), delimiter="\t")
    openings_data_frame: pandas.DataFrame = pandas.concat([openings_data_frame, df])


class Opening(TypedDict):
    eco: str
    name: str
    pgn: str


openings_data_frame["group"] = (
    openings_data_frame["name"].str.split(":").str[0].str.strip()
)
openings_data_frame["subgroup"] = (
    openings_data_frame["name"]
    .str.split(":")
    .str[1]
    .str.strip()
    .str.split(",")
    .str[0]
    .str.strip()
)
openings_data_frame: pandas.DataFrame = openings_data_frame.sort_values(
    by=["group", "name", "eco"]
)
openings_data_frame: pandas.Series[json.Any] = openings_data_frame[
    ["eco", "group", "subgroup", "name", "pgn"]
]
openings_data_frame.to_csv("./openings/all.csv", index=False)
openings_string_json: str = openings_data_frame.to_json(orient="records")


group_counts = (
    openings_data_frame.dropna(subset=["group", "subgroup"])  # optional
    .groupby(["group", "subgroup"])
    .size()
    .reset_index(name="count")
    .sort_values("count", ascending=False)
)
print(group_counts)


openings: list[dict[str]] = json.loads(openings_string_json)
with open("./openings/all.json", "w", encoding="utf-8") as openings_string_json_file:
    json.dump(openings, openings_string_json_file, ensure_ascii=False, indent=2)
