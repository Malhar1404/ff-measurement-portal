import { useCallback, useEffect, useState } from 'react';

import { MeshInfo } from '../core/MeshInfo';
import { Utils3D } from '../utils/Utils3D';

export const useMeshParser = (url: string | undefined | null) => {
  const [state, setState] = useState({
    isLoaded: false,
    meshInfo: [] as MeshInfo[],
  });

  const loader = useCallback(async () => {
    if (!url) {
      setState({ ...state, meshInfo: [] });
      return;
    }
    const nodes = await Utils3D.loadNodeMapForGLTF(url);

    let meshCore = [] as MeshInfo[];

    const allMesh = Object.values(nodes).flat();

    meshCore = allMesh.map((mesh) => MeshInfo.parseMeshInfo(mesh));

    setState({
      isLoaded: true,
      meshInfo: meshCore,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    loader();
  }, [loader]);

  return state;
};
