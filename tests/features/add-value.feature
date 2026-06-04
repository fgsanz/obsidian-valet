Feature: Add value operation
  Adding a new value to a property, respecting whether the property allows
  multiple values, and never producing duplicates.

  Scenario: Append a link to notes with existing, empty, and undefined related
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add-value on property "related" with value "[[New Topic]]"
    Then 3 notes are changed
    And note "Note A" has "[[New Topic]]" in "related"
    And note "Note A" has "[[Topic A]]" in "related"
    And note "Note B" has "[[New Topic]]" in "related"
    And note "Note C" has "[[New Topic]]" in "related"
    And the YAML of "Note A" is still valid

  Scenario: Adding a value that already exists changes nothing
    Given a fresh copy of the test vault
    When I filter notes where "related" "contains" "[[Topic A]]"
    And I apply add-value on property "related" with value "[[Topic A]]"
    Then 2 notes match
    And 0 notes are changed

  Scenario: Adding to a populated single-value property is skipped
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add-value on property "date" with value "2026-12-31"
    Then 3 notes match
    And 0 notes are changed
    And note "Note A" has property "date" equal to "2025-12-31"
