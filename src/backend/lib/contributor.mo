import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/corpus";
import Common "../types/common";

module {
  public func registerContributor(
    contributors : List.List<Types.Contributor>,
    id : Common.UserId,
    name : Text,
  ) : Bool {
    // Update if exists, else insert
    var exists = false;
    contributors.mapInPlace(func(c) {
      if (c.id == id) {
        exists := true;
        { c with name };
      } else { c };
    });
    if (not exists) {
      contributors.add({
        id;
        name;
        contributionCount = 0;
        isVerified = false;
        joinedAt = Time.now();
      });
    };
    true;
  };

  public func getContributors(contributors : List.List<Types.Contributor>) : [Types.Contributor] {
    let arr = contributors.toArray();
    arr.sort(func(a, b) { Int.compare(b.contributionCount.toInt(), a.contributionCount.toInt()) });
  };

  public func getLeaderboard(contributors : List.List<Types.Contributor>) : [Types.Contributor] {
    let sorted = getContributors(contributors);
    sorted.sliceToArray(0, if (sorted.size() < 20) sorted.size() else 20);
  };

  public func incrementContribution(
    contributors : List.List<Types.Contributor>,
    id : Common.UserId,
  ) {
    contributors.mapInPlace(func(c) {
      if (c.id == id) {
        let newCount = c.contributionCount + 1;
        let newVerified = c.isVerified or newCount >= 10;
        { c with contributionCount = newCount; isVerified = newVerified };
      } else { c };
    });
  };

  public func awardBadge(
    contributors : List.List<Types.Contributor>,
    contributorId : Common.UserId,
  ) : Bool {
    var found = false;
    contributors.mapInPlace(func(c) {
      if (c.id == contributorId) {
        found := true;
        { c with isVerified = true };
      } else { c };
    });
    found;
  };

  public func activeContributorCount(contributors : List.List<Types.Contributor>) : Nat {
    contributors.filter(func(c) { c.contributionCount > 0 }).size();
  };
};
