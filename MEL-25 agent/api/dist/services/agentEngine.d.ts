interface Negotiation {
    id: string;
    initiator_agent_id: string;
    target_agent_id: string;
    negotiation_type: string;
    terms: any;
    status: string;
}
declare class AgentEngine {
    private _isRunning;
    private performanceThreshold;
    private cashFlowThreshold;
    private creationProbability;
    private destructionProbability;
    start(): Promise<void>;
    stop(): Promise<void>;
    isRunning(): boolean;
    private evaluateAgents;
    private evaluateAgent;
    private calculatePerformanceScore;
    private shouldDestroyAgent;
    private shouldCreateAgent;
    private destroyAgent;
    private triggerAgentCreation;
    private determineNewAgentType;
    private generateAgentName;
    private generateStrategy;
    private generateResources;
    private optimizeNetwork;
    private analyzeNetworkTopology;
    private optimizeRelationships;
    private rebalanceResources;
    private identifyCreationOpportunities;
    private analyzeMarketGaps;
    private createAgentForGap;
    private getActiveAgents;
    triggerNegotiation(negotiation: Negotiation): Promise<void>;
}
export declare const agentEngine: AgentEngine;
export {};
//# sourceMappingURL=agentEngine.d.ts.map