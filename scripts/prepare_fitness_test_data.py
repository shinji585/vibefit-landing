#!/usr/bin/env python3

import json
import posixpath
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from zipfile import BadZipFile, ZipFile
from xml.etree import ElementTree as ET


NAMESPACE = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "package_rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
WEEKDAYS = (
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
)


def read_cell(cell, shared_strings):
    value = cell.find("main:v", NAMESPACE)
    if cell.attrib.get("t") == "inlineStr":
        inline = cell.find("main:is", NAMESPACE)
        return "".join(text.text or "" for text in inline.findall(".//main:t", NAMESPACE))
    if value is None:
        return None
    result = value.text
    if cell.attrib.get("t") == "s":
        return shared_strings[int(result)]
    return result


def load_sheet(path):
    with ZipFile(path) as workbook:
        workbook_xml = ET.fromstring(workbook.read("xl/workbook.xml"))
        relationships_xml = ET.fromstring(
            workbook.read("xl/_rels/workbook.xml.rels")
        )
        relationships = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships_xml.findall(
                "package_rel:Relationship", NAMESPACE
            )
        }
        shared_strings = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            strings_xml = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            shared_strings = [
                "".join(text.text or "" for text in item.findall(".//main:t", NAMESPACE))
                for item in strings_xml.findall("main:si", NAMESPACE)
            ]

        sheet = next(
            (
                item
                for item in workbook_xml.findall("main:sheets/main:sheet", NAMESPACE)
                if item.attrib.get("name") == "Fitness Tracker"
            ),
            None,
        )
        if sheet is None:
            raise ValueError("No se encontró la hoja 'Fitness Tracker'.")

        relationship_id = sheet.attrib[f"{{{NAMESPACE['rel']}}}id"]
        target = relationships[relationship_id]
        sheet_path = (
            target.lstrip("/")
            if target.startswith("/")
            else posixpath.normpath(posixpath.join("xl", target))
        )
        sheet_xml = ET.fromstring(workbook.read(sheet_path))
        rows = sheet_xml.findall(".//main:sheetData/main:row", NAMESPACE)

    parsed_rows = []
    for row in rows:
        values = {}
        for cell in row.findall("main:c", NAMESPACE):
            column = "".join(character for character in cell.attrib["r"] if character.isalpha())
            values[column] = read_cell(cell, shared_strings)
        parsed_rows.append(values)
    return parsed_rows


def required_text(value, label):
    if value is None or not value.strip():
        raise ValueError(f"Falta {label}.")
    return value.strip()


def required_number(value, label):
    if value is None or value == "":
        raise ValueError(f"Falta {label}.")
    try:
        return float(value)
    except ValueError as error:
        raise ValueError(f"{label} no es numérico: {value!r}.") from error


def nonnegative_integer(value, label):
    number = required_number(value, label)
    if number < 0 or not number.is_integer():
        raise ValueError(f"{label} debe ser un entero no negativo.")
    return int(number)


def prepare(path):
    rows = load_sheet(path)
    if not rows:
        raise ValueError("El archivo no contiene filas.")

    expected_headers = {
        "A": "User ID",
        "B": "Date",
        "C": "Workout Type",
        "D": "Workout Duration (Minutes)",
        "E": "Calories Burned",
        "F": "Steps Count",
        "G": "Calories Consumed",
        "H": "Sleep Duration (Hours)",
        "I": "Sleep Quality",
        "J": "Weight (kg)",
        "K": "Calorias por minutos",
        "L": "dias",
        "M": "tipo",
    }
    if any(rows[0].get(column) != header for column, header in expected_headers.items()):
        raise ValueError("Los encabezados de la hoja no coinciden con el formato esperado.")

    parsed = []
    for row_number, row in enumerate(rows[1:], start=2):
        if not any(value not in (None, "") for value in row.values()):
            continue

        source_id = required_text(row.get("A"), f"User ID de la fila {row_number}")
        date_serial = required_number(row.get("B"), f"Date de la fila {row_number}")
        source_date = (datetime(1899, 12, 30) + timedelta(days=date_serial)).date()
        calories_burned = nonnegative_integer(
            row.get("E"), f"Calories Burned de la fila {row_number}"
        )
        calories_consumed = nonnegative_integer(
            row.get("G"), f"Calories Consumed de la fila {row_number}"
        )
        duration = nonnegative_integer(
            row.get("D"), f"Workout Duration de la fila {row_number}"
        )
        steps = nonnegative_integer(row.get("F"), f"Steps Count de la fila {row_number}")
        sleep_hours = required_number(
            row.get("H"), f"Sleep Duration de la fila {row_number}"
        )
        weight = required_number(row.get("J"), f"Weight de la fila {row_number}")

        if not 0 <= sleep_hours <= 24:
            raise ValueError(f"Sleep Duration fuera de rango en la fila {row_number}.")
        if not 20 <= weight <= 300:
            raise ValueError(f"Weight fuera de rango en la fila {row_number}.")

        parsed.append(
            {
                "source_id": source_id,
                "source_date": source_date,
                "workout_type": row.get("C"),
                "workout_duration_minutes": duration,
                "calories_burned": calories_burned,
                "steps_count": steps,
                "calories_consumed": calories_consumed,
                "sleep_hours": sleep_hours,
                "sleep_quality": row.get("I"),
                "weight_kg": weight,
                "activity_category": row.get("M"),
            }
        )

    groups = sorted({row["source_id"] for row in parsed})
    counts = Counter(row["source_id"] for row in parsed)
    if len(groups) != 50 or any(counts[source_id] != 20 for source_id in groups):
        raise ValueError("Se esperaban 50 grupos con 20 registros cada uno.")

    users = []
    user_years = {}
    split = len(groups) // 2
    for index, source_id in enumerate(groups):
        user_number = index + 1
        year = 2024 if index < split else 2025
        user_years[source_id] = year
        users.append({"source_id": source_id, "user_number": user_number, "year": year})

    daily_logs = []
    activity_details = []
    seen_dates = set()
    for row in parsed:
        target_date = date(
            user_years[row["source_id"]],
            row["source_date"].month,
            row["source_date"].day,
        )
        date_key = (row["source_id"], target_date.isoformat())
        if date_key in seen_dates:
            raise ValueError(f"Fecha duplicada para {row['source_id']}: {target_date}.")
        seen_dates.add(date_key)

        workout_type = row["workout_type"]
        if workout_type is not None:
            workout_type = workout_type.strip()
            if workout_type == "=":
                workout_type = None

        category = row["activity_category"]
        if category is not None:
            category = category.strip() or None

        quality = row["sleep_quality"]
        if quality is not None:
            quality = quality.strip() or None

        source_id = row["source_id"]
        day_name = WEEKDAYS[target_date.weekday()]
        daily_logs.append(
            {
                "source_id": source_id,
                "log_date": target_date.isoformat(),
                "weight_kg": row["weight_kg"],
                "sleep_hours": row["sleep_hours"],
                "calories_consumed": row["calories_consumed"],
                "calories_burned": row["calories_burned"],
            }
        )
        activity_details.append(
            {
                "source_id": source_id,
                "log_date": target_date.isoformat(),
                "workout_type": workout_type,
                "workout_duration_minutes": row["workout_duration_minutes"],
                "steps_count": row["steps_count"],
                "sleep_quality": quality,
                "calories_per_minute": (
                    round(
                        row["calories_burned"] / row["workout_duration_minutes"], 4
                    )
                    if row["workout_duration_minutes"] > 0
                    else None
                ),
                "day_name": day_name,
                "activity_category": category,
            }
        )

    if len(daily_logs) != 1000 or len(activity_details) != 1000:
        raise ValueError("La carga debe contener exactamente 1.000 registros.")

    return {
        "users": users,
        "daily_logs": daily_logs,
        "activity_details": activity_details,
    }


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: prepare_fitness_test_data.py archivo.xlsx")
    try:
        json.dump(prepare(sys.argv[1]), sys.stdout, ensure_ascii=False)
    except (OSError, ValueError, KeyError, BadZipFile) as error:
        print(f"No se pudo validar el Excel: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
