import { NavigatorScreenParams } from '@react-navigation/native';
import { Priority, RequestStatus, ServiceType } from '../models/request';

export type TabParamList = {
  Home: undefined;
  Requests:
    | {
        status?: RequestStatus | 'TODOS';
        priority?: Priority | 'TODAS';

        nonce?: number;
      }
    | undefined;
  Calendar: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;

  CreateRequest: { requestId?: string; service?: ServiceType } | undefined;
  RequestDetail: { requestId: string };
};

declare global {

  namespace ReactNavigation {

    interface RootParamList extends RootStackParamList {}
  }
}
