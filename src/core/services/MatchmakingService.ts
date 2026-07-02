export class MatchmakingService {
  public async findMatch() {
    return { matchId: 'm1', players: [] };
  }

  public connectToMatch(_matchId: string) {
    // return new WebSocket(...);
  }
}

export const matchmakingService = new MatchmakingService();
