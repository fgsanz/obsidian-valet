Feature: Delete value operation
  Removing a specific value from a property across all matching notes,
  without corrupting the YAML frontmatter.

  Scenario: Remove a note link from a link-array proeprty in all matching notes
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply delete value on property "parent" with value to delete "[[Note X]]"
    Then 2 notes are changed
    And 0 notes fail
    And note "Note A" no longer has "[[Note X]]" in "parent"
    And note "Note A" has "[[Note Y|Y notes]]" in "parent"
    And the YAML of "Note A" is still valid

  Scenario: A note outside the filter keeps is not changed
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply delete value on property "parent" with value to delete "[[Note X]]"
    Then 1 notes are changed
    And note "Note D" has "[[Note X]]" in "parent"
    And the YAML of "Note D" is still valid

  Scenario: Deleting a value in a proerty with a single value leaves the parameter empty
    Given a fresh copy of the test vault
    When I filter notes where "number headings" "exists and contains" "auto, first-level 1, max 3, contents ^toc, 1.1"
    And I apply delete value on property "number headings" with value to delete "auto, first-level 1, max 3, contents ^toc, 1.1"
    Then 2 notes are changed
    And note "Note A" has "number headings" empty
    And note "Note D" has "number headings" empty
    And the YAML of "Note A" is still valid
    And the YAML of "Note D" is still valid

  Scenario: Deleting a value that does not exist, does not break anything
    Given a fresh copy of the test vault
    And I filter notes where "aliases" "exists and contains" "alias 1"
    And 6 notes match
    And I apply delete value on property "aliases" with value to delete "alias X"
    Then 0 notes are changed
    And the YAML of "Note A" is still valid
    And the YAML of "Note B" is still valid
    And the YAML of "Note C" is still valid
    And the YAML of "Note D" is still valid
    And the YAML of "Note D" is still valid
    And the YAML of "Note F" is still valid
