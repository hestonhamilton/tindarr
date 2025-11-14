import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Filter, FilterValue } from "../../../../../types/moviematch";
import { useStore } from "../../store";
import { Button } from "../atoms/Button";
import { ButtonContainer } from "../layout/ButtonContainer";
import { ErrorMessage } from "../atoms/ErrorMessage";
import { Field } from "../molecules/Field";
import { FilterField } from "../molecules/FilterField";
import { AddRemoveList } from "../atoms/AddRemoveList";
import { AutoSuggestInput } from "../molecules/AutoSuggestInput";
import { Layout } from "../layout/Layout";
import { Tr } from "../atoms/Tr";

import styles from "./Create.module.css";

export const CreateScreen = () => {
  const [{ translations, createRoom, error, routeParams }, dispatch] = useStore(
    [
      "translations",
      "createRoom",
      "error",
      "routeParams",
    ],
  );
  const [roomName, setRoomName] = useState<string>(routeParams?.roomName ?? "");
  const [roomNameError, setRoomNameError] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<Map<number, Filter>>(
    () => new Map(),
  );
  const [selectedLibraries, setSelectedLibraries] = useState<FilterValue[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<FilterValue[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<
    FilterValue[]
  >([]);
  const [yearRange, setYearRange] = useState<{ from?: string; to?: string }>(
    {},
  );

  const availableLibraries = useMemo(
    () =>
      createRoom?.availableFilters?.libraries?.map((library) => ({
        title: library.title,
        value: library.key,
      })) ?? [],
    [createRoom?.availableFilters?.libraries],
  );

  const genreOptions = createRoom?.filterValues?.genre ?? [];
  const collectionOptions = createRoom?.filterValues?.collection ?? [];

  const updateAdvancedFilters = useCallback((index: number, filter: Filter | null) => {
    setAdvancedFilters((prev) => {
      const next = new Map(prev);
      if (filter) {
        next.set(index, filter);
      } else {
        next.delete(index);
      }
      return next;
    });
  }, []);

  const advancedFiltersList = useMemo(
    () => [...advancedFilters.values()],
    [advancedFilters],
  );

  const presetFilters = useMemo(() => {
    const filters: Filter[] = [];
    if (selectedLibraries.length) {
      filters.push({
        key: "library",
        operator: "=",
        value: selectedLibraries.map((_) => _.value),
      });
    }

    if (selectedGenres.length) {
      filters.push({
        key: "genre",
        operator: "=",
        value: selectedGenres.map((_) => _.value),
      });
    }

    if (selectedCollections.length) {
      filters.push({
        key: "collection",
        operator: "=",
        value: selectedCollections.map((_) => _.value),
      });
    }

    if (yearRange.from) {
      filters.push({
        key: "year",
        operator: ">=",
        value: [yearRange.from],
      });
    }

    if (yearRange.to) {
      filters.push({
        key: "year",
        operator: "<=",
        value: [yearRange.to],
      });
    }

    return filters;
  }, [selectedLibraries, selectedGenres, selectedCollections, yearRange]);

  const filtersPayload = useMemo(
    () => [...presetFilters, ...advancedFiltersList],
    [presetFilters, advancedFiltersList],
  );

  const preview = createRoom?.filterPreview;
  const noResults = preview?.status === "success" && preview.count === 0;

  const handleCreateRoom = useCallback(async () => {
    if (!roomName) {
      setRoomNameError(translations?.FIELD_REQUIRED_ERROR ??
        "This field is required.");
      return;
    }

    if (noResults) {
      return;
    }

    if (roomName) {
      dispatch({
        type: "createRoom",
        payload: {
          roomName,
          filters: filtersPayload,
        },
      });
    }
  }, [
    dispatch,
    filtersPayload,
    noResults,
    roomName,
    translations?.FIELD_REQUIRED_ERROR,
  ]);

  useEffect(() => {
    dispatch({ type: "requestFilters" });
  }, [dispatch]);

  useEffect(() => {
    ["genre", "collection"].forEach((key) => {
      if (!createRoom?.filterValues?.[key]) {
        dispatch({ type: "requestFilterValues", payload: { key } });
      }
    });
  }, [createRoom?.filterValues, dispatch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch({
        type: "previewFilters",
        payload: { filters: filtersPayload },
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [dispatch, filtersPayload]);

  const previewLabel = (() => {
    if (!preview || preview.status === "loading") {
      return "Checking filters…";
    }
    if (preview.status === "error") {
      return preview.message ?? "Unable to preview filters.";
    }
    return `${preview.count ?? 0} matching title${
      preview.count === 1 ? "" : "s"
    }`;
  })();

  const previewStatusClass = preview?.status === "error"
    ? `${styles.previewStatus} ${styles.previewStatusError}`
    : styles.previewStatus;

  const handleYearChange = (key: "from" | "to") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
      setYearRange((prev) => ({ ...prev, [key]: sanitized }));
    };

  return (
    <Layout>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {error && <ErrorMessage message={error.message ?? error.type ?? ""} />}
        <Field
          label={<Tr name="LOGIN_ROOM_NAME" />}
          name="roomName"
          value={roomName}
          errorMessage={roomNameError}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <section className={styles.quickFilters}>
          <h2 className={styles.filtersTitle}>Quick Filters</h2>
          <div className={styles.quickFiltersGrid}>
            <div className={styles.quickFiltersGroup}>
              <span className={styles.quickFiltersLabel}>Libraries</span>
              <AutoSuggestInput
                inputName="libraries"
                items={availableLibraries}
                value={selectedLibraries}
                onChange={setSelectedLibraries}
              />
            </div>
            <div className={styles.quickFiltersGroup}>
              <span className={styles.quickFiltersLabel}>Genres</span>
              <AutoSuggestInput
                inputName="genres"
                items={genreOptions}
                value={selectedGenres}
                onChange={setSelectedGenres}
              />
            </div>
            <div className={styles.quickFiltersGroup}>
              <span className={styles.quickFiltersLabel}>
                Collections
              </span>
              <AutoSuggestInput
                inputName="collections"
                items={collectionOptions}
                value={selectedCollections}
                onChange={setSelectedCollections}
              />
            </div>
            <div className={styles.quickFiltersGroup}>
              <span className={styles.quickFiltersLabel}>Release Year</span>
              <div className={styles.yearRangeInputs}>
                <Field
                  name="releaseYearFrom"
                  value={yearRange.from ?? ""}
                  placeholder="From"
                  type="number"
                  inputMode="numeric"
                  onChange={handleYearChange("from")}
                />
                <Field
                  name="releaseYearTo"
                  value={yearRange.to ?? ""}
                  placeholder="To"
                  type="number"
                  inputMode="numeric"
                  onChange={handleYearChange("to")}
                />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.preview}>
          <p className={previewStatusClass}>{previewLabel}</p>
          {preview?.status === "error" && (
            <p className={styles.previewError}>
              Try adjusting your filters and try again.
            </p>
          )}
          {noResults && (
            <p className={styles.previewError}>
              No media match this filter set. Adjust your filters to continue.
            </p>
          )}
        </div>

        <div className={styles.filters}>
          <h2 className={styles.filtersTitle}>Advanced Filters</h2>
          <AddRemoveList
            initialChildren={0}
            onRemove={(i) => updateAdvancedFilters(i, null)}
            testHandle="filter"
          >
            {(i) =>
              createRoom?.availableFilters && (
                <FilterField
                  key={i}
                  name={String(i)}
                  onChange={(filter) => updateAdvancedFilters(i, filter)}
                  filters={createRoom.availableFilters}
                  suggestions={createRoom?.filterValues}
                  requestSuggestions={(key: string) => {
                    dispatch({ type: "requestFilterValues", payload: { key } });
                  }}
                />
              )}
          </AddRemoveList>
        </div>

        <ButtonContainer reverseMobile paddingTop="s3">
          <Button
            appearance="Tertiary"
            onPress={() =>
              dispatch({ type: "navigate", payload: { route: "join" } })}
            testHandle="back"
          >
            <Tr name="BACK" />
          </Button>
          <Button
            appearance="Primary"
            onPress={handleCreateRoom}
            disabled={noResults}
            testHandle="create-room"
          >
            <Tr name="CREATE_ROOM" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
