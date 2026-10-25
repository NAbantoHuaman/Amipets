import { NavigatorScreenParams } from '@react-navigation/native';
import { Priority, RequestStatus, ServiceType } from '../models/request';

export type TabParamList = {
  Home: undefined;
  Requests:
    | {
        status?: RequestStatus | 'TODOS';
        priority?: Priority | 'TODAS';
        /** Marca de tiempo para aplicar el filtro aunque se repita. */
        nonce?: number;
      }
    | undefined;
  Calendar: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  /** Sin requestId = crear; con requestId = editar. */
  CreateRequest: { requestId?: string; service?: ServiceType } | undefined;
  RequestDetail: { requestId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
