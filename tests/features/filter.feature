Feature: Filtering notes
  As someone curating a vault, I want to find notes by location and by property values
  so I can decide which notes a bulk operation should affect.

  Scenario: Filter by a link property that contains a value
    Given a fresh copy of the dummy vault
    When I filter notes where "parent" "contains" "[[ProjectX]]"
    Then 2 notes match

  Scenario: Filter by directory
    Given a fresh copy of the dummy vault
    When I filter notes in directory "Projects"
    Then 3 notes match

  Scenario: Filter for notes missing a property
    Given a fresh copy of the dummy vault
    When I filter notes where "parent" "does not exist"
    Then 3 notes match

  Scenario: Combine a directory and a property rule
    Given a fresh copy of the dummy vault
    When I filter notes in directory "Projects"
    And I filter notes where "status" "contains" "in-progress"
    Then 2 notes match
