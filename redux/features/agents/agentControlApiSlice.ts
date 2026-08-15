import { apiSlice } from "../../services/apiSlice";
import type {
  AgentSkillRecord,
  AgentTemplateRecord,
  AgentToolRecord,
  CreateWorkspaceAgentPayload,
  InstallAgentTemplatePayload,
  RuntimeAgentRegistryResponse,
  SaveWorkspaceToolConnectionPayload,
  ToolServerRecord,
  BulkPriceResearchRequest,
  BulkPriceResearchResponse,
  WorkspaceAgentRecord,
  WorkspaceToolConnectionRecord,
  WorkspaceToolConnectionTestResponse,
} from "./agentControlTypes";

const controlPlaneService = "agent";
const runtimeService = "agent";
const agentApi = "agent_api";

export const agentControlApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAgentTemplates: builder.query<AgentTemplateRecord[], void>({
      query: () => ({
        url: `/${agentApi}/templates/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    listWorkspaceAgents: builder.query<WorkspaceAgentRecord[], void>({
      query: () => ({
        url: `/${agentApi}/workspace-agents/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    listToolServers: builder.query<ToolServerRecord[], void>({
      query: () => ({
        url: `/${agentApi}/tool-servers/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    listWorkspaceToolConnections: builder.query<WorkspaceToolConnectionRecord[], void>({
      query: () => ({
        url: `/${agentApi}/tool-connections/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    createWorkspaceToolConnection: builder.mutation<WorkspaceToolConnectionRecord, SaveWorkspaceToolConnectionPayload>({
      query: (body) => ({
        url: `/${agentApi}/tool-connections/`,
        method: "POST",
        body,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    updateWorkspaceToolConnection: builder.mutation<
      WorkspaceToolConnectionRecord,
      { id: string; data: Partial<SaveWorkspaceToolConnectionPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/${agentApi}/tool-connections/${id}/`,
        method: "PATCH",
        body: data,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    deleteWorkspaceToolConnection: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${agentApi}/tool-connections/${id}/`,
        method: "DELETE",
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    testWorkspaceToolConnection: builder.mutation<WorkspaceToolConnectionTestResponse, string>({
      query: (id) => ({
        url: `/${agentApi}/tool-connections/${id}/test_connection/`,
        method: "POST",
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    createWorkspaceAgent: builder.mutation<WorkspaceAgentRecord, CreateWorkspaceAgentPayload>({
      query: (body) => ({
        url: `/${agentApi}/workspace-agents/`,
        method: "POST",
        body,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    updateWorkspaceAgent: builder.mutation<
      WorkspaceAgentRecord,
      { id: string; data: Partial<CreateWorkspaceAgentPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/${agentApi}/workspace-agents/${id}/`,
        method: "PATCH",
        body: data,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    deleteWorkspaceAgent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${agentApi}/workspace-agents/${id}/`,
        method: "DELETE",
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    installAgentTemplate: builder.mutation<
      WorkspaceAgentRecord,
      { templateId: string; data: InstallAgentTemplatePayload }
    >({
      query: ({ templateId, data }) => ({
        url: `/${agentApi}/templates/${templateId}/install/`,
        method: "POST",
        body: data,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    listAgentTools: builder.query<AgentToolRecord[], void>({
      query: () => ({
        url: `/${agentApi}/tools/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    listAgentSkills: builder.query<AgentSkillRecord[], void>({
      query: () => ({
        url: `/${agentApi}/skills/`,
        service: controlPlaneService,
      }),
      providesTags: ["Agent"],
    }),

    attachWorkspaceAgentTool: builder.mutation<
      WorkspaceAgentRecord,
      { id: string; tool_id: string; order?: number; is_required?: boolean; tool_config?: Record<string, unknown> }
    >({
      query: ({ id, ...body }) => ({
        url: `/${agentApi}/workspace-agents/${id}/attach_tool/`,
        method: "POST",
        body,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    detachWorkspaceAgentTool: builder.mutation<WorkspaceAgentRecord, { id: string; tool_id: string }>({
      query: ({ id, tool_id }) => ({
        url: `/${agentApi}/workspace-agents/${id}/detach_tool/`,
        method: "POST",
        body: { tool_id },
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    attachWorkspaceAgentSkill: builder.mutation<
      WorkspaceAgentRecord,
      { id: string; skill_id: string; order?: number; is_primary?: boolean; metadata?: Record<string, unknown> }
    >({
      query: ({ id, ...body }) => ({
        url: `/${agentApi}/workspace-agents/${id}/attach_skill/`,
        method: "POST",
        body,
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    detachWorkspaceAgentSkill: builder.mutation<WorkspaceAgentRecord, { id: string; skill_id: string }>({
      query: ({ id, skill_id }) => ({
        url: `/${agentApi}/workspace-agents/${id}/detach_skill/`,
        method: "POST",
        body: { skill_id },
        service: controlPlaneService,
      }),
      invalidatesTags: ["Agent"],
    }),

    getRuntimeAgentRegistry: builder.query<RuntimeAgentRegistryResponse, void>({
      query: () => ({
        url: `/${agentApi}/runtime/agents/registry/`,
        service: runtimeService,
      }),
      providesTags: ["Agent"],
    }),

    researchBulkTaskPrices: builder.mutation<BulkPriceResearchResponse, BulkPriceResearchRequest>({
      query: (body) => ({
        url: `/${agentApi}/price-research/bulk-task/`,
        method: "POST",
        body,
        service: controlPlaneService,
      }),
    }),
  }),
});

export const {
  useListAgentTemplatesQuery,
  useListWorkspaceAgentsQuery,
  useListToolServersQuery,
  useListWorkspaceToolConnectionsQuery,
  useCreateWorkspaceToolConnectionMutation,
  useUpdateWorkspaceToolConnectionMutation,
  useDeleteWorkspaceToolConnectionMutation,
  useTestWorkspaceToolConnectionMutation,
  useCreateWorkspaceAgentMutation,
  useUpdateWorkspaceAgentMutation,
  useDeleteWorkspaceAgentMutation,
  useInstallAgentTemplateMutation,
  useListAgentToolsQuery,
  useListAgentSkillsQuery,
  useAttachWorkspaceAgentToolMutation,
  useDetachWorkspaceAgentToolMutation,
  useAttachWorkspaceAgentSkillMutation,
  useDetachWorkspaceAgentSkillMutation,
  useGetRuntimeAgentRegistryQuery,
  useResearchBulkTaskPricesMutation,
} = agentControlApiSlice;
