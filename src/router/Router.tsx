import { observer } from 'mobx-react-lite';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { NavigationRoutes } from '../constant';
import { Default } from '../pages/default';

export const Router = observer(() => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={NavigationRoutes.Default} element={<Default />} />
      </Routes>
    </BrowserRouter>
  );
});
