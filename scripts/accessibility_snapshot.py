#!/usr/bin/env python3
import argparse
import json
import sys


def node_to_dict(node, depth, max_depth, query):
    try:
        role = node.getRoleName()
    except Exception:
        role = "unknown"
    try:
        name = node.name
    except Exception:
        name = None
    try:
        description = node.description
    except Exception:
        description = None
    try:
        text = node.queryText().getText(0, -1)
    except Exception:
        text = None
    try:
        component = node.queryComponent()
        extents = component.getExtents(0)
        bounds = {
            "x": extents.x,
            "y": extents.y,
            "width": extents.width,
            "height": extents.height,
        }
    except Exception:
        bounds = None

    haystack = " ".join([value for value in [role, name, description, text] if value]).lower()
    if query and query not in haystack:
      matched_children = []
      if depth < max_depth:
          for child in node:
              child_dict = node_to_dict(child, depth + 1, max_depth, query)
              if child_dict is not None:
                  matched_children.append(child_dict)
      if not matched_children:
          return None
      return {
          "id": str(id(node)),
          "role": role,
          "name": name,
          "description": description,
          "text": text,
          "bounds": bounds,
          "children": matched_children,
      }

    children = []
    if depth < max_depth:
        for child in node:
            child_dict = node_to_dict(child, depth + 1, max_depth, query)
            if child_dict is not None:
                children.append(child_dict)

    return {
        "id": str(id(node)),
        "role": role,
        "name": name,
        "description": description,
        "text": text,
        "bounds": bounds,
        "children": children,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", default=None)
    parser.add_argument("--max-depth", type=int, default=4)
    args = parser.parse_args()

    try:
        import pyatspi
    except Exception as exc:
        print(json.dumps([]))
        print(str(exc), file=sys.stderr)
        return

    desktop = pyatspi.Registry.getDesktop(0)
    query = args.query.lower() if args.query else None
    result = []
    for app in desktop:
        app_dict = node_to_dict(app, 0, args.max_depth, query)
        if app_dict is not None:
            result.append(app_dict)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
