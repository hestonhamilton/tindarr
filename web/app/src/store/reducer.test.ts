import { expect } from "chai";
import { reducer, initialState } from "./reducer";
import type { Filters } from "../../../../types/moviematch";

const mockFilters: Filters = {
  filters: [],
  filterTypes: {},
  libraries: [],
};

describe("store reducer - create room filters", () => {
  it("stores available filters when requested", () => {
    const state = reducer(initialState, {
      type: "requestFiltersSuccess",
      payload: mockFilters,
    });

    expect(state.createRoom?.availableFilters).to.equal(mockFilters);
  });

  it("sets preview state to loading when preview is requested", () => {
    const state = reducer(initialState, {
      type: "previewFilters",
      payload: { filters: [] },
    } as any);

    expect(state.createRoom?.filterPreview?.status).to.equal("loading");
  });

  it("captures preview counts on success", () => {
    const loadingState = reducer(initialState, {
      type: "previewFilters",
      payload: { filters: [] },
    } as any);

    const successState = reducer(loadingState, {
      type: "previewFiltersSuccess",
      payload: { count: 7 },
    });

    expect(successState.createRoom?.filterPreview).to.deep.equal({
      status: "success",
      count: 7,
    });
  });
});
