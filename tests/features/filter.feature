Feature: Filtering notes
  As someone curating a vault, I want to find notes by location and by property values
  so I can decide which notes a bulk operation should affect.

  Scenario: Filter by a tag value
    Given a fresh copy of the test vault
    When I filter notes where "tags" "contains" "tag1"
    Then 4 notes match

  Scenario: Filter by directory
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    Then 3 notes match

  Scenario: Filter for notes missing a property
    Given a fresh copy of the test vault
    When I filter notes where "parent" "does not exist"
    Then 6 notes match

  Scenario: Combine a directory and a property rule
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 2"
    And I filter notes where "tags" "contains" "tag3/subtag3b"
    Then 1 notes match
