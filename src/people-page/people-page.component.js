import React, { Fragment } from "react";
import queryString from "query-string";
import { getPeople } from "../utils/api.js";
import styles from "./people-page.krem.css";
import PeopleList from "../people-list/people-list.component.js";
import SelectedPerson from "./selected-person/selected-person.component.js";
import { useCss } from "kremling";

const initialState = {
  pageNum: 1,
  nextPage: true,
  loadingPeople: true,
  selectedPerson: undefined,
  people: []
};

export default function PeoplePage(props) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const { nextPage, loadingPeople, people, selectedPerson, pageNum } = state;
  const scope = useCss(styles);

  React.useEffect(() => {
    if (nextPage && loadingPeople) {
      dispatch({ type: "loadingPeople" });

      const subscription = getPeople(pageNum).subscribe(
        results => {
          dispatch({ type: "newPeople", results });
        },
        err => {
          console.log("err", err); // eslint-disable-line
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [pageNum, nextPage, loadingPeople]);

  React.useEffect(() => {
    const search = props.location.search;
    const parsed = queryString.parse(search);

    if (
      (state.selectedPerson === undefined && parsed.selected !== undefined) ||
      (state.selectedPerson &&
        parsed &&
        parsed.selected !== state.selectedPerson.id)
    ) {
      const person = state.people.find(p => p.id === parsed.selected);
      if (person) {
        dispatch({ type: "selectPerson", person });
      }
    }
  }, [props.location.search]);

  return (
    <div className="peoplePage" {...scope}>
      <div className="peoplePageContents">
        <div className="listWrapper">
          {nextPage ? (
            <button
              className="brand-button margin-bottom-16"
              onClick={fetchMore}
              disabled={!nextPage || loadingPeople}
            >
              Fetch More people
            </button>
          ) : null}
          {loadingPeople && people.length === 0 ? (
            <div>Loading ...</div>
          ) : (
            <PeopleList
              people={people}
              loadingPeople={loadingPeople}
              selectPerson={selectPerson}
            />
          )}
        </div>
        <div className="selectedWrapper">
          <div className="selectedPerson">
            <SelectedPerson selectedPerson={selectedPerson} />
          </div>
        </div>
      </div>
    </div>
  );

  function selectPerson(index) {
    dispatch({ type: "selectPersonByIndex", index });
  }

  function fetchMore() {
    dispatch({ type: "fetchMore" });
  }
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case "loadingPeople":
      return { ...state, loadingPeople: true };
    case "newPeople":
      return {
        ...state,
        people: state.people.concat(action.results.results),
        nextPage: Boolean(action.results.next),
        loadingPeople: false
      };
    case "selectPerson":
      return {
        ...state,
        selectedPerson: action.person
      };
    case "fetchMore":
      return {
        ...state,
        loadingPeople: true,
        pageNum: state.pageNum + 1
      };
    default:
      throw Error(`Unknown action type '${action.type}'`);
  }
}
