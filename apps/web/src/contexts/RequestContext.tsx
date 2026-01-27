import React, { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";

// Types
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestState {
  method: HttpMethod;
  url: string;
  queryParams: KeyValue[];
  headers: KeyValue[];
  bodyType: "none" | "json" | "form";
  bodyContent: string;
  isLoading: boolean;
  response: any | null; // Placeholder for now
  responseStatus: number | null;
  responseTime: number | null;
  responseSize: number | null;
}

// Initial State
const initialState: RequestState = {
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/todos/1",
  queryParams: [{ id: "1", key: "", value: "", enabled: true }],
  headers: [
    { id: "1", key: "Content-Type", value: "application/json", enabled: true },
  ],
  bodyType: "none",
  bodyContent: "",
  isLoading: false,
  response: null,
  responseStatus: null,
  responseTime: null,
  responseSize: null,
};

// Actions
type Action =
  | { type: "SET_FIELD"; field: keyof RequestState; value: any }
  | { type: "UPDATE_PARAM"; id: string; field: keyof KeyValue; value: any }
  | { type: "ADD_PARAM" }
  | { type: "REMOVE_PARAM"; id: string }
  | { type: "START_REQUEST" }
  | {
      type: "SET_RESPONSE";
      response: any;
      status: number;
      time: number;
      size: number;
    }
  | { type: "RESET_RESPONSE" };

// Reducer
const requestReducer = (state: RequestState, action: Action): RequestState => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "START_REQUEST":
      return {
        ...state,
        isLoading: true,
        response: null,
        responseStatus: null,
      };
    case "SET_RESPONSE":
      return {
        ...state,
        isLoading: false,
        response: action.response,
        responseStatus: action.status,
        responseTime: action.time,
        responseSize: action.size,
      };
    // Add param logic later if needed
    default:
      return state;
  }
};

// Context
const RequestContext = createContext<
  | {
      state: RequestState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(requestReducer, initialState);

  return (
    <RequestContext.Provider value={{ state, dispatch }}>
      {children}
    </RequestContext.Provider>
  );
};

export const useRequest = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error("useRequest must be used within a RequestProvider");
  }
  return context;
};
