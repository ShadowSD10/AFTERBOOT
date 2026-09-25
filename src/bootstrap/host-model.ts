export interface HostModel {
  readonly productName: "AFTERBOOT";
  readonly systemName: "SHADOW OS";
  readonly phase: "preparing";
  readonly statusMessage: string;
}

export function createInitialHostModel(): Readonly<HostModel> {
  return Object.freeze({
    productName: "AFTERBOOT",
    systemName: "SHADOW OS",
    phase: "preparing",
    statusMessage: "System environment is being prepared",
  });
}
