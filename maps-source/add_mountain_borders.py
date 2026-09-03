#!/usr/bin/env python3
"""Пост-обработка уже сгенерированных карт (src/assets/maps/data/*.json):
добавляет map.mountainBorders — список горных хребтов НА ГРАНИЦЕ между двумя
конкретными провинциями, которые блокируют прямую атаку между ними (см.
gameLogic.ts pairKey/isBlockedPair и MapScene.tsx).

Работает поверх уже сохранённых points/neighbors каждой карты — исходные
геоданные (Natural Earth) и scipy Voronoi заново не трогает, поэтому
безопасно перезапускать без сетевых зависимостей и без риска получить другую
случайную геометрию провинций.

Правила выбора хребтов:
  - Кандидат — только граница, НЕ входящая в остовное дерево графа соседства
    (BFS от провинции с минимальным id). Это гарантирует, что после удаления
    всех горных границ карта остаётся полностью связной атаками через
    открытые границы — не может быть отрезанных провинций.
  - Реальная общая граница считается через shapely intersection полигонов
    provinces[i].points / provinces[j].points; вырожденные касания в одной
    точке (длина ~0) в кандидаты не попадают.
  - Из оставшихся кандидатов детерминированно (хеш от id карты + пары id
    провинций — без RNG, чтобы результат был воспроизводим) выбирается ~40%.
"""
import hashlib
import json
import sys
from pathlib import Path

from shapely.geometry import Polygon, LineString, MultiLineString, GeometryCollection

DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "maps" / "data"
MIN_BORDER_LEN = 8.0
BLOCK_PROBABILITY = 0.4


def stable_roll(map_name: str, a: int, b: int) -> float:
    """Детерминированный псевдослучайный [0,1) — без RNG/seed-состояния,
    чтобы скрипт можно было перезапускать сколько угодно раз с тем же
    результатом (соответствует hash() в src/utils/random.ts по духу, но
    отдельная реализация — тут нужен float, а не int-хеш)."""
    key = f"{map_name}:{min(a, b)}:{max(a, b)}".encode("utf-8")
    digest = hashlib.sha256(key).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def spanning_tree_edges(province_ids: list[int], neighbors: dict[int, list[int]]) -> set[tuple[int, int]]:
    start = min(province_ids)
    visited = {start}
    queue = [start]
    tree: set[tuple[int, int]] = set()
    while queue:
        current = queue.pop(0)
        for nb in sorted(neighbors.get(current, [])):
            if nb in visited:
                continue
            visited.add(nb)
            tree.add((min(current, nb), max(current, nb)))
            queue.append(nb)
    # На случай несвязного графа соседства (не должно происходить при
    # корректной генерации, но не полагаемся на это молча) — остаток компонент
    # тоже подключаем через BFS с новых стартовых точек, чтобы spanning_tree
    # действительно покрывало все провинции.
    for pid in province_ids:
        if pid in visited:
            continue
        visited.add(pid)
        queue = [pid]
        while queue:
            current = queue.pop(0)
            for nb in sorted(neighbors.get(current, [])):
                if nb in visited:
                    continue
                visited.add(nb)
                tree.add((min(current, nb), max(current, nb)))
                queue.append(nb)
    return tree


def shared_border(poly_a: Polygon, poly_b: Polygon):
    inter = poly_a.boundary.intersection(poly_b.boundary)
    if inter.is_empty:
        return None

    lines: list[LineString] = []
    if isinstance(inter, LineString):
        lines = [inter]
    elif isinstance(inter, MultiLineString):
        lines = list(inter.geoms)
    elif isinstance(inter, GeometryCollection):
        lines = [g for g in inter.geoms if isinstance(g, LineString)]
    if not lines:
        return None

    longest = max(lines, key=lambda ls: ls.length)
    total_len = sum(ls.length for ls in lines)
    if total_len < MIN_BORDER_LEN:
        return None

    mid = longest.interpolate(0.5, normalized=True)
    (x0, y0), (x1, y1) = longest.coords[0], longest.coords[-1]
    import math

    angle = math.degrees(math.atan2(y1 - y0, x1 - x0))
    return {"x": round(mid.x, 1), "y": round(mid.y, 1), "angle": round(angle, 1), "length": round(total_len, 1)}


def process_map(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    provinces = data["provinces"]
    by_id = {p["id"]: p for p in provinces}
    neighbors = {p["id"]: p["neighbors"] for p in provinces}
    province_ids = list(by_id.keys())

    tree = spanning_tree_edges(province_ids, neighbors)

    all_pairs: set[tuple[int, int]] = set()
    for pid, nbs in neighbors.items():
        for nb in nbs:
            all_pairs.add((min(pid, nb), max(pid, nb)))

    candidates = sorted(all_pairs - tree)

    polygons = {pid: Polygon(p["points"]) for pid, p in by_id.items()}

    mountain_borders = []
    for a, b in candidates:
        roll = stable_roll(data["name"], a, b)
        if roll >= BLOCK_PROBABILITY:
            continue
        border = shared_border(polygons[a], polygons[b])
        if border is None:
            continue
        mountain_borders.append({"a": a, "b": b, **border})

    data["mountainBorders"] = mountain_borders
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    blocked_pct = 100 * len(mountain_borders) / max(1, len(all_pairs))
    print(f"{path.name}: {len(all_pairs)} границ, {len(mountain_borders)} горных ({blocked_pct:.0f}%)")


def main() -> None:
    files = sorted(DATA_DIR.glob("*.json"))
    if not files:
        print(f"Не нашёл карт в {DATA_DIR}", file=sys.stderr)
        sys.exit(1)
    for f in files:
        process_map(f)


if __name__ == "__main__":
    main()
