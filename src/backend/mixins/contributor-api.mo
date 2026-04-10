import List "mo:core/List";
import ContributorLib "../lib/contributor";
import CorpusTypes "../types/corpus";

mixin (contributors : List.List<CorpusTypes.Contributor>) {
  public shared ({ caller }) func registerContributor(name : Text) : async Bool {
    ContributorLib.registerContributor(contributors, caller.toText(), name);
  };

  public query func getContributors() : async [CorpusTypes.Contributor] {
    ContributorLib.getContributors(contributors);
  };

  public query func getLeaderboard() : async [CorpusTypes.Contributor] {
    ContributorLib.getLeaderboard(contributors);
  };

  public shared ({ caller = _ }) func awardBadge(contributorId : Text) : async Bool {
    ContributorLib.awardBadge(contributors, contributorId);
  };
};
