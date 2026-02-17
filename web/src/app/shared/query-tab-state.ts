import { ActivatedRoute, Router } from '@angular/router';

export function resolveQueryTab<T extends string>(
  rawValue: string | null,
  allowedTabs: readonly T[],
  fallbackTab: T
): T {
  if (!rawValue) {
    return fallbackTab;
  }

  return (allowedTabs as readonly string[]).includes(rawValue) ? (rawValue as T) : fallbackTab;
}

export async function navigateToQueryTab<T extends string>(
  router: Router,
  route: ActivatedRoute,
  tab: T,
  queryParamKey = 'tab'
): Promise<void> {
  await router.navigate([], {
    relativeTo: route,
    queryParams: { [queryParamKey]: tab },
    queryParamsHandling: 'merge'
  });
}
