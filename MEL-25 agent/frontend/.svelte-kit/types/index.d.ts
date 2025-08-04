type DynamicRoutes = {
	
};

type Layouts = {
	"/": undefined;
	"/test": undefined
};

export type RouteId = "/" | "/test";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/test";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = never;