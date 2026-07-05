Feature: Filtering notes
  As someone curating a vault, I want to find notes by location and by property values
  so I can decide which notes a bulk operation should affect.

  Scenario: Filter by a tag value
    Given a fresh copy of the test vault
    When I filter notes where "tags" "exists and contains" "tag1"
    Then 4 notes match

  Scenario: Filter by directory using "is"
    Given a fresh copy of the test vault
    When I filter notes where directory "is" "Dir 1"
    Then 3 notes match

  Scenario: Combine directory rules with explicit AND / OR
    Given a fresh copy of the test vault
    When I filter notes where directory "is" "Dir 1"
    And combining with "and" where directory "is not" "Dir 1/Subdir 1.1"
    And combining with "or" where directory "is" "Dir 3"
    Then 3 notes match

  Scenario: Two sibling directories combined with AND match nothing
    Given a fresh copy of the test vault
    When I filter notes where directory "is" "Dir 1"
    And combining with "and" where directory "is" "Dir 3"
    Then 0 notes match

  Scenario: Filter for notes missing a property
    Given a fresh copy of the test vault
    When I filter notes where "parent" "does not exist"
    # +2 for the book fixtures (Books/ and Books – Kindle highlights/), which have no `parent`.
    Then 8 notes match

  Scenario: Filter for notes where a property exists
    Given a fresh copy of the test vault
    When I filter notes where "related" "exists"
    # +1 for the Books/ book note, which has a `related` property.
    Then 5 notes match

  Scenario: Combine a directory and a property rule
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 2"
    And I filter notes where "tags" "exists and contains" "tag3/subtag3b"
    Then 1 notes match

  Scenario: Filter a link property by the exact note name and alias
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note Y|Y notes]]"
    Then 2 notes match

  Scenario: A link query with a different alias does not match the same note
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note Y|Wrong alias]]"
    Then 0 notes match

  Scenario: A link query with no alias matches the note regardless of its alias
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note Y]]"
    Then 2 notes match

  Scenario: Filter for notes where a property exists and is not empty
    Given a fresh copy of the test vault
    When I filter notes where "time" "exists and is not empty"
    Then 2 notes match

  Scenario: Filter for notes where a property exists and is empty
    Given a fresh copy of the test vault
    When I filter notes where "time" "exists and is empty"
    Then 2 notes match

  Scenario: Filter with "exists and does not contain"
    Given a fresh copy of the test vault
    When I filter notes where "tags" "exists and does not contain" "tag2"
    # +1 for the Books/ book note, which has tags but not `tag2`.
    Then 3 notes match

  Scenario: Text matching is case-insensitive by default
    Given a fresh copy of the test vault
    When I filter notes where "aliases" "exists and contains" "ALIAS 1"
    Then 6 notes match

  Scenario: Case-sensitive matching distinguishes letter case
    Given a fresh copy of the test vault
    When I filter notes where "aliases" "exists and contains" "ALIAS 1" matching case
    Then 0 notes match

  Scenario: Combine two property rules with OR
    Given a fresh copy of the test vault
    When I filter notes where "tags" "exists and contains" "tag2"
    And combining with "or" where "tags" "exists and contains" "tag3/subtag3b"
    Then 4 notes match
