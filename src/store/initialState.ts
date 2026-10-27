import { VeterinaryRequest } from '../models/request';

export interface RequestsState {

  requests: VeterinaryRequest[];

  loading: boolean;
}

export const initialState: RequestsState = {
  requests: [],
  loading: false,
};
