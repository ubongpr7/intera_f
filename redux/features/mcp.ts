
import { get } from 'http';
import { apiSlice } from '../services/apiSlice';
import { getCookie } from 'cookies-next';


const mcp_api='mcp_server'
const service ='mcp'

export const mcpServerApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    

    getProductMCPTools: builder.query({
      query: () => ({
        url: `product_api/mcp`,
        service:'product',
      }),
      
    }),
  }),
});

export const { 
  useGetProductMCPToolsQuery,
  
} = mcpServerApiSlice;


