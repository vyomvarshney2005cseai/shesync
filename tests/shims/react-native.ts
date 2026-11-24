export const Platform = { OS: 'android', Version: 34, select: (o: any) => o.android ?? o.default };
export const AppState = { addEventListener: () => ({ remove() {} }), currentState: 'active' };
export const StyleSheet = { create: (o: any) => o };
