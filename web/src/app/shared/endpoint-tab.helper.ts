import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpExchange } from '../core/api.types';

export type EndpointTabSpec = {
  title: string;
  url: string;
};

export async function fetchEndpointTab(
  http: HttpClient,
  endpointByTab: Record<string, EndpointTabSpec>,
  tab: string
): Promise<{ title: string; exchange: HttpExchange } | null> {
  const endpoint = endpointByTab[tab];
  if (!endpoint) {
    return null;
  }

  const exchange = await firstValueFrom(http.get<HttpExchange>(endpoint.url));
  return {
    title: endpoint.title,
    exchange
  };
}
