import { assertEquals } from "/deps.ts";
import {
  filterLibraries,
  filtersToPlexQueryString,
} from "/internal/app/moviematch/providers/plex.ts";
import type { Filter, Library } from "/types/moviematch.ts";

Deno.test("filtersToPlexQueryString ignores library filters and encodes ranges", () => {
  const filters: Filter[] = [
    { key: "library", operator: "=", value: ["lib-1"] },
    { key: "genre", operator: "=", value: ["Comedy", "Action"] },
    { key: "year", operator: ">=", value: ["1990"] },
    { key: "year", operator: "<=", value: ["1999"] },
  ];

  const result = filtersToPlexQueryString(filters);

  assertEquals(result, {
    "genre": "Comedy,Action",
    "year>": "1990",
    "year<": "1999",
  });
});

Deno.test("filterLibraries selects only libraries present in filters", () => {
  const libraries: Library[] = [
    { key: "1", title: "Movies", type: "movie" },
    { key: "2", title: "Classics", type: "movie" },
    { key: "3", title: "Documentaries", type: "movie" },
  ];

  const filtersByKey: Filter[] = [
    { key: "library", operator: "=", value: ["2"] },
  ];

  const filtersByTitle: Filter[] = [
    { key: "library", operator: "=", value: ["Documentaries"] },
  ];

  assertEquals(
    filterLibraries(libraries, filtersByKey).map((library) => library.key),
    ["2"],
  );
  assertEquals(
    filterLibraries(libraries, filtersByTitle).map((library) => library.title),
    ["Documentaries"],
  );
});
