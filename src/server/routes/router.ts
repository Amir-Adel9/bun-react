import index from '../../client/index.html';
import helloRouter from './hello';

export const routes = {
  '/*': index,
  ...helloRouter,
};
