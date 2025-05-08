'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpClient } from './client';
import { MCPRequest, MCPResponse } from '../types/shared';

async function fetchFromMCP<T>(method: string, params: Record<string, any> = {}): Promise<T> {
  const request: MCPRequest = {
    id: `${method}-${Date.now()}`,
    method,
    params,
    jsonrpc: '2.0'
  };

  const response = await mcpClient(request);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.result as T;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export interface Predicate {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function fetchConcepts(params?: QueryParams): Promise<Concept[]> {
  return fetchFromMCP<Concept[]>('listConcepts', params || {});
}

export function fetchConcept(id: string): Promise<Concept> {
  return fetchFromMCP<Concept>('getConcept', { id });
}

export function createConcept(concept: Omit<Concept, 'id'>): Promise<Concept> {
  return fetchFromMCP<Concept>('createConcept', concept);
}

export function updateConcept(concept: Concept): Promise<Concept> {
  return fetchFromMCP<Concept>('updateConcept', concept);
}

export function deleteConcept(id: string): Promise<boolean> {
  return fetchFromMCP<boolean>('deleteConcept', { id });
}

export function fetchPredicates(params?: QueryParams): Promise<Predicate[]> {
  return fetchFromMCP<Predicate[]>('listPredicates', params || {});
}

export function fetchPredicate(id: string): Promise<Predicate> {
  return fetchFromMCP<Predicate>('getPredicate', { id });
}

export function createPredicate(predicate: Omit<Predicate, 'id'>): Promise<Predicate> {
  return fetchFromMCP<Predicate>('createPredicate', predicate);
}

export function updatePredicate(predicate: Predicate): Promise<Predicate> {
  return fetchFromMCP<Predicate>('updatePredicate', predicate);
}

export function deletePredicate(id: string): Promise<boolean> {
  return fetchFromMCP<boolean>('deletePredicate', { id });
}

export function fetchResources(params?: QueryParams): Promise<Resource[]> {
  return fetchFromMCP<Resource[]>('listResources', params || {});
}

export function fetchResource(id: string): Promise<Resource> {
  return fetchFromMCP<Resource>('getResource', { id });
}

export function createResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
  return fetchFromMCP<Resource>('createResource', resource);
}

export function updateResource(resource: Resource): Promise<Resource> {
  return fetchFromMCP<Resource>('updateResource', resource);
}

export function deleteResource(id: string): Promise<boolean> {
  return fetchFromMCP<boolean>('deleteResource', { id });
}

export function fetchTopics(params?: QueryParams): Promise<Topic[]> {
  return fetchFromMCP<Topic[]>('listTopics', params || {});
}

export function fetchTopic(id: string): Promise<Topic> {
  return fetchFromMCP<Topic>('getTopic', { id });
}

export function createTopic(topic: Omit<Topic, 'id'>): Promise<Topic> {
  return fetchFromMCP<Topic>('createTopic', topic);
}

export function updateTopic(topic: Topic): Promise<Topic> {
  return fetchFromMCP<Topic>('updateTopic', topic);
}

export function deleteTopic(id: string): Promise<boolean> {
  return fetchFromMCP<boolean>('deleteTopic', { id });
}

export function useConceptsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: ['concepts', params],
    queryFn: () => fetchConcepts(params),
    placeholderData: (prev) => prev,
  });
}

export function useConceptQuery(id: string) {
  return useQuery({
    queryKey: ['concept', id],
    queryFn: () => fetchConcept(id),
    enabled: !!id,
  });
}

export function useCreateConceptMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createConcept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
    },
  });
}

export function useUpdateConceptMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateConcept,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['concept', data.id] });
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
    },
  });
}

export function useDeleteConceptMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteConcept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
    },
  });
}

export function usePredicatesQuery(params?: QueryParams) {
  return useQuery({
    queryKey: ['predicates', params],
    queryFn: () => fetchPredicates(params),
    placeholderData: (prev) => prev,
  });
}

export function usePredicateQuery(id: string) {
  return useQuery({
    queryKey: ['predicate', id],
    queryFn: () => fetchPredicate(id),
    enabled: !!id,
  });
}

export function useCreatePredicateMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPredicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicates'] });
    },
  });
}

export function useUpdatePredicateMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePredicate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['predicate', data.id] });
      queryClient.invalidateQueries({ queryKey: ['predicates'] });
    },
  });
}

export function useDeletePredicateMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePredicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicates'] });
    },
  });
}

export function useResourcesQuery(params?: QueryParams) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => fetchResources(params),
    placeholderData: (prev) => prev,
  });
}

export function useResourceQuery(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => fetchResource(id),
    enabled: !!id,
  });
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResourceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateResource,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useTopicsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: ['topics', params],
    queryFn: () => fetchTopics(params),
    placeholderData: (prev) => prev,
  });
}

export function useTopicQuery(id: string) {
  return useQuery({
    queryKey: ['topic', id],
    queryFn: () => fetchTopic(id),
    enabled: !!id,
  });
}

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useUpdateTopicMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTopic,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['topic', data.id] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useDeleteTopicMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}
