declare module "supercluster" {
  interface Feature<PointGeometry, Properties> {
    type: "Feature";
    properties: Properties;
    geometry: PointGeometry;
    id?: number | string;
  }

  interface PointGeometry {
    type: "Point";
    coordinates: [number, number];
  }

  type ClusterProperties = {
    cluster: boolean;
    cluster_id?: number;
    point_count: number;
    [key: string]: any;
  };

  type ClusterFeature<Properties = Record<string, any>> = Feature<PointGeometry, Properties>;

  class Supercluster<Properties = Record<string, any>> {
    constructor(options?: Record<string, any>);
    load(data: Feature<PointGeometry, Properties>[]): void;
    getClusters(bbox: [number, number, number, number], zoom: number): Array<
      | ClusterFeature<Properties & ClusterProperties>
      | ClusterFeature<Properties>
      | any
    >;
    getClusterExpansionZoom(clusterId: number): number;
  }

  export default Supercluster;
}
